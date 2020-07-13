---
title: glslt
permalink: /projects/glslt/
excerpt: GLSL Template compiler
sidebar:
  title: Links
  nav: glslt-links
project:
  status: active
  release: true
  repo: glslt
---

{% include project-only-badges.html %} [![Build Status](https://travis-ci.com/vtavernier/glslt.svg?branch=master)](https://travis-ci.com/vtavernier/glslt) [![Build status](https://ci.appveyor.com/api/projects/status/uimwa630f4v8t096/branch/master?svg=true)](https://ci.appveyor.com/project/vtavernier/glslt/branch/master) [![GitHub release](https://img.shields.io/github/v/release/vtavernier/glslt)](https://github.com/vtavernier/glslt/releases) [![License](https://img.shields.io/github/license/vtavernier/glslt)](LICENSE)

`glslt` is a prototype language for adding template functions to the GLSL
language.

Although they are not strictly needed for basic shading operations, they are of
particular interest for designing reusable GLSL components which agree on
common interfaces, as function pointers (or callbacks) would provide.

## Installation

Check out the [releases](https://github.com/vtavernier/glslt/releases) for
pre-compiled binaries for stable versions.

Alternatively, you may compile `glslt` from source, assuming you have the
[Rust](https://rustup.rs/) compiler installed:

```bash
# Fetch the source
git clone https://github.com/vtavernier/glslt.git
cd glslt

# Run the program directly
cargo run -- test.glsl

# Or, install the glsltcc binary permanently
cargo install --release --force .
glsltcc test.glsl
```

## Usage

### Static template function parameters

`glslt` supports *static template function parameters*. This means, passing the
name of an already-declared function as a parameter for a templated function.
Here is an example:

```glsl
// A pointer to a function that has no args and returns an int
//
// We use function prototypes for this matter since they're
// basically useless in GLSL. Since there can be no indirect
// recursion, there is no need for function pre-declarations.
int intfn();

// A first function that could be an intfn
int fnReturnsOne() { return 1; }

// A second function that could be an intfn
int fnReturnsTwo() { return 2; }

// A template function. It's recognized as a template because it uses intfn
// which has been declared as a function pointer.
//
// In the generated code, there will be no function called fnTemplate, as all
// calls to fnTemplate will be replaced with template specializations.
//
// Thus, callback can only be an identifier of an existing function, which
// should (later: must with type-checking) match the pointer type
int fnTemplate(in intfn callback) { return callback(); }

void main() {
    // Calling fnTemplate with function pointers
    gl_FragColor =
        vec4(fnTemplate(fnReturnsOne), fnTemplate(fnReturnsTwo), 0., 1.);
}
```

Note that we do not define a new syntax. Instead, we use the function
pre-declaration syntax which is rarely used to declare function pointers. Thus,
all your existing tooling still works with `glslt`.

In order to run this code on your GPU, you need to process it so function
templates are *instantiated* with their actual template parameters. This is
where this tool comes in:

```bash
# Assuming you installed the pre-built glsltcc binary, if running from source use `cargo run --` instead.
#
# test.glsl is our input example, output.glsl is the generated code.
glsltcc -o output.glsl test.glsl
```

The resulting code will look like this:

```glsl
int fnReturnsOne() {
    return 1;
}

int fnReturnsTwo() {
    return 2;
}

int _glslt_fnTemplate_dd5173() {
    return fnReturnsOne();
}

int _glslt_fnTemplate_4314fd() {
    return fnReturnsTwo();
}

void main() {
    gl_FragColor = vec4(_glslt_fnTemplate_dd5173(), _glslt_fnTemplate_4314fd(), 0., 1.);
}
```

Note how the template function calls have been replaced by regular GLSL
functions. This code can be directly used in an OpenGL application.

### Lambda template function parameters

`glslt` also supports *lambda template function parameters*. Instead of passing
a function name as a parameter to the templated function, you may pass an
expression. This expression may capture local variables and parameters, which
will be taken into account when instantiating the template. Here is an example:

```glsl
float sdf3d(in vec3 p);

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float opElongate(in sdf3d primitive, in vec3 p, in vec3 h) {
    vec3 q = p - clamp(p, -h, h);
    return primitive(q);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = vec4(vec3(opElongate(sdSphere(_1, 4.), vec3(fragCoord, 0.), vec3(1., 2., 3.))), 1.0);
}
```

Note how instead of just passing `sdSphere` as a template parameter, we pass
`sdSphere(_1, 4.)`. This translates to calling `sdSphere` with the first
parameter given by the template function `opElongate`, while the second
parameter is the constant `4.`. This results in the following code:

```glsl
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float _glslt_opElongate_d20939(in vec3 p, in vec3 h) {
    vec3 q = p - clamp(p, -h, h);
    return sdSphere(q, 4.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = vec4(vec3(_glslt_opElongate_d20939(vec3(fragCoord, 0.), vec3(1., 2., 3.))), 1.);
}
```

Since captures are supported, this example may have been written with the
sphere diameter being a parameter:

```glsl
float sdf3d(in vec3 p);

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float opElongate(in sdf3d primitive, in vec3 p, in vec3 h) {
    vec3 q = p - clamp(p, -h, h);
    return primitive(q);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float sz = 5.;
    fragColor = vec4(vec3(opElongate(sdSphere(_1, sz), vec3(fragCoord, 0.), vec3(1., 2., 3.))), 1.0);
    //                                            ^^
    // Using a local variable in the template argument
}
```

The variable is properly captured in the generated code:

```glsl
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// _glslt_lp2 is the captured variable input
float _glslt_opElongate_d9170f(in vec3 p, in vec3 h, float _glslt_lp2) {
    vec3 q = p - clamp(p, -h, h);
    return sdSphere(q, _glslt_lp2);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float sz = 5.;
    fragColor = vec4(vec3(_glslt_opElongate_d9170f(vec3(fragCoord, 0.), vec3(1., 2., 3.), sz)), 1.);
    //                                                                 Captured variable: ^^
}
```

#### Named placeholders

When passing a lambda expression to a template function, you may use the
unnamed placeholders `_1`, `_2`, etc. to refer to the first, second, etc.
arguments to the template function call. You may also use the parameter names
as declared in the function prototype. The previous example could be written as
follows:

```glsl
// In sdf3d template parameters, `p` is the first parameter name
float sdf3d(in vec3 p);

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float opElongate(in sdf3d primitive, in vec3 p, in vec3 h) {
    vec3 q = p - clamp(p, -h, h);
    return primitive(q);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = vec4(vec3(opElongate(sdSphere(_p, 1.0), vec3(fragCoord, 0.), vec3(1., 2., 3.))), 1.0);
    //                                        ^^
    // Named placeholder parameter in a template instead of _1
}
```

The generated code will look like this:

```glsl
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float _glslt_opElongate_784a47(in vec3 p, in vec3 h) {
    vec3 q = p - clamp(p, -h, h);
    return sdSphere(q, 1.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = vec4(vec3(_glslt_opElongate_784a47(vec3(fragCoord, 0.), vec3(1., 2., 3.))), 1.);
}
```

### Nested lambda expressions

Nested lambda expressions are supported, however due to the syntax being used,
we have to make a decision on how to resolve the anonymous placeholders to
their corresponding lambda. The current algorithm transforms innermost lambdas
first, so the placeholders will resolve to the most nested expression first.

This may be circumvented by using named placeholders (as long as there is no
conflict) since undefined identifiers are passed as-is to the other passes of
the transformation algorithm, and thus, to outer lambdas.

### Support for include directives

`#include` directives are supported and will be processed, using the same rules
as C preprocessors: double-quoted paths will be looked up from the current file
being parsed, and then fallback to the system include paths. Angle-quoted paths
will be looked up from the system include paths.

All files are only included once, as if they all started with `#pragma once`.

**Warning**: since include directives are processed at the AST level, shaders
which rely on included files to generate valid syntax are not supported.

### Minifying mode

In its default mode, the GLSLT compiler will copy all input declarations to its
output (except function prototypes) and insert instantiated templates right
before they are used.

However, if you are using the GLSLT compiler with a large template library,
this will generate a lot of unused code. By using the `-K, --keep-fns` argument
to the `glsltcc` command, GLSLT switches to the minifying mode. In this mode,
only the functions, types, globals and `#define` directives that are transitive
dependencies of the functions specified by the `-K` argument are kept.

Note that in this mode, no preprocessor directives (outside of `#define` and
their use) are supported. `#version`, `#extension` and precision specifiers
will be included at the top of the generated code.

As an example, compiling the previous example with `glsltcc -KsdSphere` will
only return the code for the sdSphere function, since it has no dependencies.

This mode hasn't been tested throughly yet, so some types of declarations may
not be supported.

## Features

- [x] Include support
- [ ] Preserve comments in original source
- [ ] Report position in compiler errors
- [x] Lambda template function parameters
- [x] Static template function parameters

## Limitations

This program is based on the excellent [glsl](https://github.com/phaazon/glsl)
crate for parsing and manipulating the GLSL AST in Rust. However, since it's
only an AST and not a full parse tree, we have currently no way of preserving
comments or original formatting.

Furthermore, since pre-processor directives have to be passed through to the
GPU for accurate execution, shaders which are syntactically invalid without
pre-processing are not supported.

## Author

Vincent Tavernier <vince.tavernier@gmail.com>
---
title: tinygl
permalink: /projects/tinygl/
excerpt: Lightweight Rust wrapper for OpenGL on web & desktop
sidebar:
  title: Links
  nav: tinygl-links
project:
  status: active
  release: true
  repo: tinygl
---

{% include project-only-badges.html %} [![Build Status](https://travis-ci.com/vtavernier/tinygl.svg?branch=master)](https://travis-ci.com/vtavernier/tinygl)

tinygl is an environment to create OpenGL programs in Rust with:

* Pre-processing of GLSL shader code (#include support, syntax checking, etc.), using [shaderc](https://github.com/google/shaderc-rs/)
* Conversion of GLSL shaders to SPIR-V or transpilation to GLSL ES for WebGL, also using shaderc
* Rust code generation for loading shaders, programs and type-checked uniform setter methods

This is a project currently under heavy development, do not expect any kind of stability for a while.

## Building

* (Optional) Re-generate OpenGL desktop bindings using `cargo xtask gen-bindings`
* `cargo build`

## Authors

Vincent Tavernier <vince.tavernier@gmail.com>

## License

Licensed under MIT license ([LICENSE](LICENSE) or http://opensource.org/licenses/MIT).

---
title: Arduino Internals — What's behind the magic?
tags: [arduino, software, electronics]
date: 2021-04-12
draft: true
description: The Arduino ecosystem changed the world of DIY electronics, let's take a look under the hood to figure out
  how that happened.
---

Arduino is an open-source software and hardware platform tailored for electronics beginners and enthusiasts alike. Since
the early models' releases (Arduino Diecimila in 2007 and Duemilanove in 2009), they have become ubiquitous to the point
that "an Arduino" is often used as a synonym for "a microcontroller", and have been used in countless projects by makers
around the world.

![Arduino Duemilanove 2009b](Arduino_Duemilanove_2009b.jpg "An Arduino Duemilanove. The first Arduino I actually
programmed. Source: [Wikipedia](https://commons.wikimedia.org/wiki/File:Arduino_Duemilanove_2009b.jpg)")

What this project actually achieved is simplifying microcontroller programming to the extreme, replacing obscure
datasheet diving and reference implementation diagrams dissection with intuitive function calls *mostly* portable
across the entire official product range. The "hello world" of electronics, the blinking LED was simplified from this:

```cpp
// Compile with:       avr-gcc -mmcu=atmega328p -DF_CPU=16000000L
// Create binary with: avr-objcopy -O ihex -R .eeprom a.out a.hex
// Upload with:        avrdude -p atmega328p -c arduino -P /dev/ttyUSB0 -b 57600 -D -U flash:w:a.hex:i
// Only works on the Arduino Uno series, with a 16MHz µC
#include <avr/io.h>
#include <util/delay.h>

int main() {
  // Set the LED's pin to output
  DDRB |= (1 << PB5);

  while (1) {
    // Toggle the LED pin state
    PORTB ^= (1 << PB5);
    // Wait
    _delay_ms(1000);
  }
}
```

To this:

```cpp
// In the Arduino IDE, click "upload"
// Portable across all Arduinos which have a built-in LED
#include <Arduino.h>

void setup() {
  // Set the LED's pin to output
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // Switch on the LED
  digitalWrite(LED_BUILTIN, HIGH);
  // Wait
  delay(1000);
  // Switch off the LED
  digitalWrite(LED_BUILTIN, LOW);
  // Wait
  delay(1000);
}
```

Of course, this is just scratching the surface, since opening up the world of microcontrollers to the masses also
sparked a lot of open-source development, and many libraries can be used to interact with the "shields", add-ons to the
base Arduino board: [motor drivers](https://store.arduino.cc/arduino-motor-shield-rev3), [Ethernet
interfaces](https://store.arduino.cc/arduino-ethernet-shield-2), [IMUs](https://store.arduino.cc/arduino-mkr-imu-shield)
and countless others.

Various [starter kits](https://www.amazon.com/ELEGOO-Project-Tutorial-Controller-Projects/dp/B01D8KOZF4) can also be
used if you want to prototype your own circuits with an Arduino Uno compatible board and some standard components, such
as an ultrasonic distance reader, humidity and temperature sensor, 7-segment displays, etc.

The USB (data and power!) connection on most boards means these are just plug and play: buy an Arduino board from your
favorite reseller, and you can program it from any desktop or laptop PC.

Recently however, a lot of "Arduino-compatible" boards started appearing on the market, such as the hugely popular
ESP8266 from Espressif Systems, available on the original [NodeMCU](https://en.wikipedia.org/wiki/NodeMCU), but also in
Arduino-Uno [footprints](https://www.amazon.com/ARCELI-ESP8266-Development-Compatible-Arduino/dp/B07J2QKNHB/), with
built-in Wi-Fi capabilities, much more processing power as well as large storage.

![WeMos D1](WeMos_D1.jpg "WeMos D1, one of the many ESP8266 boards")

Even though those were not initially programmable from the Arduino IDE, the Arduino community added support for these as
they became one of the most go-to choices for IoT projects over the recent years.

But with such a wide variety of hardware, how does the Arduino platform provide an *almost* seamless development
experience on AVR, ARM, Xtensa and many other architectures?

Experienced embedded developers know this means installing various toolchains for cross-compiling, fiddling with linker
scripts to get the right memory layout for your specific board revision, and a bunch of other boring stuff we won't get
to in this article. Instead, we'll be focusing on the software side: what's exactly behind `#include <Arduino.h>` on a
few select platforms, and why we would need to care about it.

> All the examples in this article were developed using [PlatformIO](https://platformio.org/), which I highly recommend
> instead of the Arduino IDE. Although the recent releases have made huge progress, I prefer the versatility of my text
> editor (with [ccls](https://github.com/MaskRay/ccls) completion) and compiling/uploading with a simple `pio run -t
> upload` command.

# Arduino framework architecture

For most software projects, the go-to way for getting information about library internals would be hitting the reference
manual online. In the case of Arduino, it's located at https://www.arduino.cc/reference/en. However, it's surprisingly
succint: function signatures included in the documentation don't even show the arguments'
type[^arduino-reference-no-signature].

For a beginner, using the C++ language, whose type conversions are a minefield[^cpp-minefield], on a target that doesn't
support debugging (and where buffer overflows result in usually very funny looking output on your serial port monitor)
can lead to many headaches and hours of painful trial and error.

This reference was also written for the *original* Arduino boards, i.e. the AVR-based ones. The most notable example is
the [`PROGMEM`](https://www.arduino.cc/reference/en/language/variables/utilities/progmem/) variable modifier, which is
only available on AVR targets. Trying to use it on non-AVR targets results in a compile-error, unless your code detects
it's being compiled for a non-AVR target.

The reference documentation also mixes [standard library functions](https://www.arduino.cc/reference/en/#functions),
[plain datatypes and complex ones](https://www.arduino.cc/reference/en/#variables)[^string-datatype], [Arduino program
structure and C++ language details](https://www.arduino.cc/reference/en/#structure) on a single page.

**To be absolutely clear:** I am not saying this is a bad thing. This documentation has been written with the clear
intent of being a one-stop point, easy to approach for a beginner, and should be sufficient for hobbyists to get
started, until they are more at ease with electronics and/or software development --- and it accomplishes this goal
rather well. But for more advanced users, it is clearly lacking information about design choices and platform
differences --- a notable issue when promoting Arduino code as platform-independent.

My goal when writing this article was to share with the world the process I went through to unearth some differences I
noticed when working with various boards (ESP8266, Arduino Nano 33 BLE, ATTiny85-based Digispark and others). So let's
get started!

## What's `Arduino.h` exactly?

All Arduino code should `#include` this header to access the standard library functions described in the reference
documentation. Thankfully, when using an IDE with code completion[^vim-platformio-ccls], we can just ask the editor to
open `Arduino.h` and look at its definitions.

Given a standard PlatformIO installation, this will bring up
[`~/.platformio/packages/framework-arduino-avr/cores/arduino/Arduino.h`](https://github.com/arduino/ArduinoCore-avr/blob/master/cores/arduino/Arduino.h),
which already has a lot of interesting features:
* All the constants in the documentation, as `#define`s
* `min` and `max` are macros? But the reference described them as functions. Moving on...
* Gated behind `__cplusplus`, includes for some types defined by Wiring, the predecessor of the Arduino framework,
  itself based on Processing. The main one being `WString.h`, defining the `String` type.
* Some board-specific stuff, like including USB API support or hardware serial support depending on preprocessor
  definitions
* A final include for `pins_arduino.h`, which contains a bunch of mappings from Arduino pin numbers (13 for
  `LED_BUILTIN` for example) to physical microcontroller pins (`digital_pin_to_port_PGM` and others). This one is stored
  in the `variants` folder, and contains definitions for the various boards based on this platform, which may have
  different pin mappings or enabled features, like the Arduino Mega vs. the Arduino Uno.

**Conclusion**: `Arduino.h` is already hardware-specific. Its definitions follow what we can see in the reference
documentation, but it is definitely **not** portable. It is part of what the Arduino platform calls a *core*, which is
an implementation of the Arduino *specification* for a set of boards that share the same architecture. In this case,
this is the original AVR core, and it's even available on GitHub, in a sensible location:
https://github.com/arduino/ArduinoCore-avr. Let's explore it a bit more.

### Arduino, for Atmel's AVR platform

Browsing through this repository, among the files we already discovered, we notice some metadata (`boards.txt`) which
reference the documentation for the... Arduino CLI? More specifically for this file, the [platform
specification](https://arduino.github.io/arduino-cli/latest/platform-specification/) which explains a tiny bit more what
we're looking for:

> Platforms add support for new boards to the Arduino development software. They are installable either via Boards
> Manager or manual installation to the hardware folder of Arduino's sketchbook folder (AKA "user directory").

Well then those cores should contain the definition for all those built-in functions, in order to translate them to
actual microcontroller hardware operations. And sure enough, in
[`wiring_digital.c`](https://github.com/arduino/ArduinoCore-avr/blob/9f8d27f09f3bbd1da1374b5549a82bda55d45d44/cores/arduino/wiring_digital.c#L138),
in all its microcontroller-programming-simplifying glory:

```cpp
void digitalWrite(uint8_t pin, uint8_t val)
{
	uint8_t timer = digitalPinToTimer(pin);
	uint8_t bit = digitalPinToBitMask(pin);
	uint8_t port = digitalPinToPort(pin);
	volatile uint8_t *out;

	if (port == NOT_A_PIN) return;

	// If the pin that support PWM output, we need to turn it off
	// before doing a digital write.
	if (timer != NOT_ON_TIMER) turnOffPWM(timer);

	out = portOutputRegister(port);

	uint8_t oldSREG = SREG;
	cli();

	if (val == LOW) {
		*out &= ~bit;
	} else {
		*out |= bit;
	}

	SREG = oldSREG;
}
```

So `digitalWrite` actually does the following:
* Check that the given pin is suitable for digital output (the `digitalPinTo*` family of functions will return `NOT_*`
  sentinel values otherwise)
* Disable PWM on the target pin if it was enabled
* Disable hardware interrupts, set the target value, and then re-enable them

For a microcontroller running at 16MHz, `digitalWrite` is a noticeably expensive operation. Indeed, it does:
* 3 `PROGMEM` reads (`digitalPinTo*` function calls).
* 2 branches to validate the pin values. Note that the function fails silently for wrong pin values.
* 1 more `PROGMEM` read for getting the port's output register.
* Compute a bit-mask from those memory reads.
* Clear interrupts.
* One last branch to determine if a bit should be cleared or set.
* Apply the bitmask: this is a read-modify-write operation, and thus non-atomic, which requires disabled interrupts for
  correctness.
* Restore interrupts.

These multiple levels of indirections are, at the time of writing, **not** optimized away by `avr-gcc`. The following
Arduino sketch (which only uses constants for both the pin and value):

```cpp
#include <Arduino.h>

void setup() { pinMode(LED_BUILTIN, OUTPUT); }

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  digitalWrite(LED_BUILTIN, LOW);
}
```

Compiles to the following assembly[^arduino-platformio-optimization]:

```s
000000e0 <digitalWrite.constprop.0>:
  ; [truncated: 54 instructions for figuring computing timer, bit, port and the other checks]
  ; uint8_t oldSREG = SREG;
 158:	9f b7       	in	r25, 0x3f	; 63
  ; cli();
 15a:	f8 94       	cli
  ; if (val == LOW) {
 15c:	81 11       	cpse	r24, r1
 15e:	04 c0       	rjmp	.+8      	; 0x168 <digitalWrite.constprop.0+0x88>
  ; *out &= ~bit;
 160:	8c 91       	ld	r24, X
 162:	20 95       	com	r18
 164:	28 23       	and	r18, r24
  ; } else {
 166:	02 c0       	rjmp	.+4      	; 0x16c <digitalWrite.constprop.0+0x8c>
  ; *out |= bit;
 168:	ec 91       	ld	r30, X
 16a:	2e 2b       	or	r18, r30
 16c:	2c 93       	st	X, r18
  ; }
  ; SREG = oldSREG;
 16e:	9f bf       	out	0x3f, r25	; 63
  ; }
 170:	08 95       	ret

00000206 <main>:
 ; [truncated: Arduino framework initialization]
 ; [truncated: inlined call to pinMode(...) ]

 ; Note: loop is inlined since it's only called from Arduino's main
 ; digitalWrite(LED_BUILTIN, HIGH);
 2c6:	81 e0       	ldi	r24, 0x01	; 1
 2c8:	0e 94 70 00 	call	0xe0	; 0xe0 <digitalWrite.constprop.0>
 ; digitalWrite(LED_BUILTIN, LOW);
 2cc:	80 e0       	ldi	r24, 0x00	; 0
 2ce:	0e 94 70 00 	call	0xe0	; 0xe0 <digitalWrite.constprop.0>
 ; Note: the following is the Arduino's while loop around calling loop()
 2d2:	20 97       	sbiw	r28, 0x00	; 0
 2d4:	c1 f3       	breq	.-16     	; 0x2c6 <main+0xc0>

 ; [truncated: more main code]
```

While its equivalent pure-AVR code:

```cpp
#include <avr/io.h>

int main() {
  DDRB |= (1 << PB5);

  while (1) {
    PORTB |= (1 << PB5);
    PORTB &= ~(1 << PB5);
  }
}
```

Compiles to the optimal assembly below (`sbi` sets a specific bit in a port register):

```s
00000080 <main>:
  ; DDRB |= (1 << PB5);
  80:	25 9a       	sbi	0x04, 5	; 4
  ; while (1) {
  ; PORTB |= (1 << PB5);
  82:	2d 9a       	sbi	0x05, 5	; 5
  ; PORTB &= ~(1 << PB5);
  84:	2d 98       	cbi	0x05, 5	; 5
  ; }
  86:	fd cf       	rjmp	.-6      	; 0x82 <main+0x2>
```

Which brings us to the essential question: **is the Arduino framework's implementation right?**

In a sense, **yes**: it translates user-facing Arduino board pin identifiers to hardware pins under the hood, ensures
there are no conflicts with PWM settings, and does update the output register in a correct (atomic) way. **But**, this
is a very costly abstraction (67 instructions + function call compared to one *single-cycle* instruction). If your code
does some high-frequency bit banging (every few clock cycles), you won't be able to use `digitalWrite`, which is orders
of magnitude slower, and has side effects (disabling interrupts temporarily).

Of course, these abstractions are what make Arduino beginner-friendly, but are limited because of their implementation
in C++. A language with more robust compile-time guarantees could reason more efficiently about hardware port usage, and
could also compile to the optimal version --- but [the Rust backend isn't there
yet](https://github.com/rust-lang/rust/issues/78260).

I think these limitations should be highlighted in the reference documentation. This wouldn't overload beginners
browsing the function reference for the first time, as long as it's hidden in an expandable "For advanced users"
section. This function isn't the only one with caveats (does this call for a part 2 🤔?), and it is likely that large
projects using the Arduino platform will encounter more of those -- undocumented -- limitations and
performance/readability trade-offs.

## ESP-based boards

## nrf/Mbed based boards

# Discussion: pros and cons of the Arduino ecosystem

# Case study: PWM dimming the Arduino 33 BLE's RGB LED

# Conclusion

[^arduino-reference-no-signature]: https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/
[^cpp-minefield]: Using this [digest version](https://en.cppreference.com/w/cpp/language/implicit_conversion) of the C++
  standard for implicit conversions, try predicting what passing an `int` to a function that expects a `byte`
  (Arduino-specific definition). Bonus points if you can describe what happens on overflow on the various architectures
  this code could be run on.
[^string-datatype]: `int`, `char`, `float` and other built-in data-types are C++ built-ins, supported directly by the
  target platform and are basically free to create. This isn't the case of the `String` type, which allocates memory, an
  expensive and error-prone operation (running out of heap space overwrites your program's stack --- a "technicality"
  not mentioned in the documentation).
[^vim-platformio-ccls]: Creating a project with `pio init -b uno --ide vim` will create the necessary files for the
  `ccls` language server to provide completion and go-to definition for Arduino code. This what I mainly used for this
  work.
[^arduino-platformio-optimization]: PlatformIO uses `-flto -Os` as the default optimization level, but changing those
  settings didn't influence the result significantly.

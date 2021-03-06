# Getopts

[![Travis CI](https://img.shields.io/travis/jorgebucaran/getopts/master.svg)](https://travis-ci.org/jorgebucaran/getopts)
[![Codecov](https://img.shields.io/codecov/c/github/jorgebucaran/getopts/master.svg)](https://codecov.io/gh/jorgebucaran/getopts)
[![npm](https://img.shields.io/npm/v/getopts.svg)](https://www.npmjs.org/package/getopts)

Getopts is a [high-performance](#benchmark-results) Node.js CLI arguments parser. It's designed closely following the [Utility Syntax Guidelines](http://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html#tag_12_02) so that your programs behave like typical UNIX utilities effortlessly, without sacrificing developer experience.

## Installation

<pre>
npm i <a href="https://www.npmjs.com/package/getopts">getopts</a>
</pre>

## Usage

Use Getopts to parse the [command-line arguments](https://en.wikipedia.org/wiki/Command-line_interface#Arguments) passed to your program.

<pre>
$ <a href="./example/demo">example/demo</a> --turbo -xw10 -- alpha beta
</pre>

You can find the command-line arguments in the [`process.argv`](https://nodejs.org/docs/latest/api/process.html#process_process_argv) array. The first element in the array will be the path to the node executable, followed by the path to the file being executed. We don't need either one, so we'll copy everything after the second index and pass it to the [`getopts`](<(#getoptsargv-opts)>) function.

```js
const getopts = require("getopts")

const options = getopts(process.argv.slice(2), {
  alias: {
    w: "warp",
    t: "turbo"
  }
})
```

The `getopts` function takes an array of arguments (and optional options object) and returns an object that maps argument names to values. Use this object to look up the value of an option by its name.

The underscore `_` key is reserved for [operands](#operands). Operands consist of standalone arguments (non-options), the dash `-` symbol and every argument after a double-dash `--` sequence.

```js
{
  _: ["alpha", "beta"],
  w: 10,
  x: true,
  t: true,
  warp: 10,
  turbo: true
}
```

### Parsing Rules

#### Short Options

- A short option consists of a dash `-` followed by a single alphabetic character. Multiple short options can be clustered together without spaces. Short options will be casted to boolean unless followed by an [operand](#operand) or if adjacent to one or more non-alphabetic characters matching the regular expression <code>/[!-@[-`{-~][\s\s]\*/</code>.

  ```js
  getopts(["-ab", "-c"]) //=> { _: [], a:true, b:true, c:true }
  ```

  ```js
  getopts(["-a", "alpha"]) //=> { _: [], a:"alpha" }
  ```

  ```js
  getopts(["-abc1"]) //=> { _: [], a:true, b:true, c:1 }
  ```

- Only the last character in a cluster of options can be parsed as a string or as a number depending on the argument that follows it. Any options preceding it will be `true`. You can use [`opts.string`](#optstring) to indicate that one or more options should be parsed as strings.

  ```js
  getopts(["-abc-100"], {
    string: ["b"]
  }) //=> { _: [], a:true, b:"c-100" }
  ```

- The argument immediately following a short or a long option, which is not an option itself, will be parsed as the value of the option. You can use [`opts.boolean`](#optsboolean) to indicate that one or more options should be parsed as booleans, causing any adjacent argument to be parsed as an operand and not as a value.

  ```js
  getopts(["-a", "alpha"], {
    boolean: ["a"]
  }) //=> { _: ["alpha"], a:true }
  ```

- Any character listed in the ASCII table can be used as a short option if it's the first character after the dash.

  ```js
  getopts(["-9", "-#10", "-%0.01"]) //=> { _:[], 9:true, #:10, %:0.01 }
  ```

#### Long Options

- A long option consists of two dashes `--` followed by one or more characters. Any character listed in the ASCII table can be used to form a long option with the exception of the `=` symbol, which separates an option's name and value.

  ```js
  getopts(["--turbo", "--warp=10"]) //=> { _: [], turbo:true, warp:10 }
  ```

  ```js
  getopts(["--warp=e=mc^2"]) //=> { _: [], warp:"e=mc^2" }
  ```

  ```js
  getopts(["----", "alpha"]) //=> { _: [], --:"alpha" }
  ```

- Options can be negated if they are prefixed with the sequence `--no-`. Their value is always `false`.

  ```js
  getopts(["--no-turbo"]) //=> { _: [], turbo:false }
  ```

#### Operands

- Every argument after the first double-dash sequence `--` is saved to the operands array `_`.

  ```js
  getopts(["--", "--alpha", "001"]) //=> { _:["--alpha", "001"] }
  ```

- Every non-option, standalone argument is an operand.

  ```js
  getopts(["alpha", "-w9"]) //=> { _: ["alpha"], w:9 }
  ```

  ```js
  getopts(["--code=alpha", "beta"]) //=> { _: ["beta"], code:"alpha" }
  ```

- A standalone dash `-` is an operand.

  ```js
  getopts(["--turbo", "-"]) //=> { _:["-"], turbo:true }
  ```

#### Other

- Options missing from the arguments array that have been designated as a boolean or string type will be added to the result object as `false` and `""` respectively.

  ```js
  getopts([], {
    string: ["a"],
    boolean: ["b"]
  }) //=> { _:[], a:"", b:false }
  ```

* The string `"false"` is always casted to a boolean `false`.

  ```js
  getopts(["--turbo=false"]) //=> { _:[], turbo:false }
  ```

* Options that appear multiple times are parsed as an array that consists of every value in the order they are found.

  ```js
  getopts(["-a?alpha=beta", "-aa0.1"] //=> { _:[], a:["?alpha=beta", true, 0.1] }
  ```

* A value may contain newlines or other control characters.

  ```js
  getopts(["--text=top\n\tcenter\bottom"]) //=> { _:[], text:"top\n\tcenter\bottom" }
  ```

## API

### getopts(argv, opts)

#### argv

An array of arguments to parse, e.g., [`process.argv`](https://nodejs.org/docs/latest/api/process.html#process_process_argv).

Any arguments prefixed with one or two dashes are referred to as [short](#short-options) and [long](#long-options) options respectively. Options can have one or more [aliases](#optssalias). Numerical values are casted to numbers when possible.

#### opts.alias

An object of option aliases. An alias can be a string or an array of strings. Aliases let you define alternate names for an option, e.g. the short (abbreviated) and long (canonical) variations.

```js
getopts(["-t"], {
  alias: {
    turbo: ["t", "T"]
  }
}) //=> { _:[], t:true, T:true, turbo:true }
```

#### opts.boolean

An array of options that should be parsed as booleans. In the example, declaring `t` as boolean causes the next argument to be parsed as an operand and not as a value.

```js
getopts(["-t", "alpha"], {
  boolean: ["t"]
}) //=> { _:["alpha"], t:true }
```

#### opts.string

An array of options that should be parsed as strings. In the example, by declaring `t` as string, all adjacent characters are parsed as a single value and not as individual options.

```js
getopts(["-atabc"], {
  string: ["t"]
}) //=> { _:[], a:true, t:"abc" }
```

#### opts.default

An object of default values for options that are not present in the arguments array.

```js
getopts(["--warp=10"], {
  default: {
    warp: 15,
    turbo: true
  }
}) //=> { _:[], warp:10, turbo:true }
```

#### opts.unknown

A function that will be invoked for every unknown option. Return `false` to discard the option. Unknown options are those that appear in the arguments array, but are not present in `opts.string`, `opts.boolean`, `opts.default`, or `opts.alias`.

```js
getopts(["-abc"], {
  unknown: option => "a" === option
}) //=> { _:[], a:true }
```

## Benchmark Results

All tests run on a 2.4GHz Intel Core i7 CPU with 16 GB memory.

```
npm i -C bench && node bench
```

<pre>
mri × 363,444 ops/sec
yargs × 31,734 ops/sec
minimist × 270,504 ops/sec
getopts × 1,252,164 ops/sec
</pre>

## License

Getopts is MIT licensed. See the [LICENSE](LICENSE.md) for details.

const { Suite } = require("benchmark")

const runBenchmark = (test, modules) =>
  Object.keys(modules)
    .reduce(
      (suite, name) => suite.add(name, () => test(modules[name], name)),
      new Suite().on("cycle", ({ target: { name, hz } }) =>
        console.log(`${name} × ${Math.floor(hz).toLocaleString()} ops/sec`)
      )
    )
    .run()

runBenchmark(
  parse => parse(["--turbo", "--no-kill", "-xw1000", "--", "alpha", "beta"]),
  {
    mri: require("mri"),
    yargs: require("yargs-parser"),
    minimist: require("minimist"),
    getopts: require("..")
  }
)

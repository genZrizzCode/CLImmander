# CLImmander

A powerful, modern CLI toolkit built with Node.js, math.js and commander.js. Includes utilities for weather, ping, math, games, system info, and more!

## Installation

```sh
npm install -g climmander
```

Or use directly with npx:

```sh
npx climmander <command>
```

### To run this right off the bat:

In your terminal, run:

```sh
curl -fsSL https://raw.githubusercontent.com/genZrizzCode/CLImmander/main/run.sh | bash -s -- <command>
```

Examples:

```sh
curl -fsSL https://raw.githubusercontent.com/genZrizzCode/CLImmander/main/run.sh | bash -s --
```

```sh
curl -fsSL https://raw.githubusercontent.com/genZrizzCode/CLImmander/main/run.sh | bash -s -- weather
```

> **WARNING:**
> If you do this method, pressing `^C` will end the whole process, and interactive commands (`bash -s -- pong <difficulty>`) will not work.

## Usage

All commands are run using the `order` CLI:

```sh
order <command> [options]
```

## Commands

### Weather
Get the weather for a city (default: Los Angeles):
```sh
order weather [city] [--imperial]
```
- `--imperial` or `-i` for Fahrenheit/mph

### Ping
Ping a website and print the response time (default: google.com):
```sh
order ping [host]
```

### Hello
Greet the user by name:
```sh
order hello [name]
```

### Reverse
Reverse the input string:
```sh
order reverse <string...>
```

### Echo
Echo the input string(s):
```sh
order echo <string...>
```

### Pong
Play a simple Pong game in your terminal:
```sh
order pong
```
- Use Up/Down arrows to move
- First to 11 wins
- Option to clear terminal after game

### Random Integer
Print a random integer between min and max (defaults: 0 100):
```sh
order random-int [min] [max]
```

### Date
Show the current date and time, updating every second:
```sh
order date
```

### MathJS
Evaluate a mathematical expression (use `^` for powers, `sqrt()` for roots):
```sh
order mathjs <expression...>
```
Examples:
- `order mathjs "2^8"`
- `order mathjs "sqrt(16)"`
- `order mathjs "nthRoot(27, 3)"`

### Calendar
Show the current month calendar with today highlighted:
```sh
order cal
```

### CLI Stats
Show CLI project stats and usage count (per user/device):
```sh
order cli-stats
```

### My Info
Show information about your device and terminal (no info is kept by us):
```sh
order my-info
```

## License
MIT

---

Made with ❤️ by genZrizzCode

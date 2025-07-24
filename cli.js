#!/usr/bin/env node

import https from 'https';
import chalk from 'chalk';
import { Command } from 'commander';
import { create, all as mathAll } from 'mathjs';
const math = create(mathAll);
const program = new Command();

program
  .name('order')
  .description('Order CLI for various commands')
  .version('1.0.0');

program
  .command('weather [city]')
  .description('Get the weather information (default: Los Angeles)')
  .option('-i, --imperial', 'Use imperial units (Fahrenheit, mph)')
  .action((city, options) => {
    console.log("Fetching weather information...");
    const unit = options.imperial ? 'imperial' : 'metric';
    const cityName = city && city.length > 0 ? city.join(' ') : 'Los Angeles';
    const url = `https://wttr.in/${encodeURIComponent(cityName)}?format=j1`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const weather = JSON.parse(data);
          const current = weather.current_condition[0];
          console.log(`Weather for ${cityName}:`);
          console.log(`  Condition: ${current.weatherDesc[0].value}`);
          if (unit === 'imperial') {
            console.log(`  Temperature: ${current.temp_F}°F`);
            console.log(`  Feels like: ${current.FeelsLikeF}°F`);
            console.log(`  Wind: ${current.windspeedMiles} mph ${current.winddir16Point}`);
          } else {
            console.log(`  Temperature: ${current.temp_C}°C`);
            console.log(`  Feels like: ${current.FeelsLikeC}°C`);
            console.log(`  Wind: ${current.windspeedKmph} km/h ${current.winddir16Point}`);
          }
          console.log(`  Humidity: ${current.humidity}%`);
          console.log(`  Pressure: ${current.pressure} hPa`);
        } catch (e) {
          console.error('Could not parse weather data.');
        }
      });
    }).on('error', () => {
      console.error('Failed to fetch weather data.');
    });
  });

program
  .command('ping [host]')
  .description('Ping a website and print the response time (default: google.com)')
  .action(async (host = 'google.com') => {
    const { exec } = (await import('child_process')).default;
    // Use -c 1 for Unix/macOS, fallback to -n 1 for Windows
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `ping -n 1 ${host}` : `ping -c 1 ${host}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Ping failed:', stderr || error.message);
        return;
      }
      let timeMatch;
      if (isWin) {
        // Windows: time=XXms
        timeMatch = stdout.match(/time[=<]([0-9]+)ms/i);
      } else {
        // Unix/macOS: time=XX.XXX ms
        timeMatch = stdout.match(/time=([0-9.]+) ms/);
      }
      if (timeMatch) {
        console.log(chalk.bold.green('🏓 PONG!') + ` ${timeMatch[1]} ms`);
      } else {
        console.log(chalk.bold.green('🏓 PONG!') + '(time not found)');
      }
    });
  });

program
  .command('hello [name]')
  .description('Greets the user by name (default: World)')
  .action((name) => {
    console.log(`Hello, ${name || 'World'}!`);
  });

program
  .command('reverse <string...>')
  .description('Reverse the input string')
  .action((string) => {
    if (!string || string.length === 0) {
      console.log('Usage: reverse <string>');
      process.exit(1);
    }
    const input = string.join(' ');
    const reversed = input.split('').reverse().join('');
    console.log(reversed);
  });

program
  .command('echo <string...>')
  .description('Echo the input string(s)')
  .action((string) => {
    if (!string || string.length === 0) {
      console.log('Usage: echo <string>');
      process.exit(1);
    }
    console.log(string.join(' '));
  });

program
  .command('pong')
  .description('Play a simple Pong game in your terminal')
  .action(async () => {
    // Basic terminal Pong using Node.js built-ins
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write('\x1Bc'); // Clear screen

    // Game settings
    const width = 40;
    const height = 15;
    let paddleY = Math.floor(height / 2);
    const paddleHeight = 3;
    let ballX = Math.floor(width / 2);
    let ballY = Math.floor(height / 2);
    let ballVX = 1;
    let ballVY = 1;
    let playerScore = 0;
    let botScore = 0;
    let running = true;
    let botPaddleY = Math.floor(height / 2);

    function draw() {
      let out = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x === 1 && y >= paddleY && y < paddleY + paddleHeight) {
            out += '|'; // Player Paddle
          } else if (x === width - 2 && y >= botPaddleY && y < botPaddleY + paddleHeight) {
            out += '|'; // Bot Paddle
          } else if (x === ballX && y === ballY) {
            out += 'O'; // Ball
          } else if (x === 0 || x === width - 1) {
            out += '#'; // Wall
          } else {
            out += ' ';
          }
        }
        out += '\n';
      }
      out += `Player: ${playerScore}  Bot: ${botScore}\n`;
      process.stdout.write('\x1Bc' + out);
    }

    function update() {
      // Ball movement
      ballX += ballVX;
      ballY += ballVY;
      // Bot AI: move paddle towards ball
      if (ballVY > 0 && botPaddleY + paddleHeight / 2 < ballY && botPaddleY < height - paddleHeight) botPaddleY++;
      if (ballVY < 0 && botPaddleY + paddleHeight / 2 > ballY && botPaddleY > 0) botPaddleY--;
      // Bounce off top/bottom
      if (ballY <= 0 || ballY >= height - 1) ballVY *= -1;
      // Bounce off player paddle
      if (ballX === 2 && ballY >= paddleY && ballY < paddleY + paddleHeight) {
        ballVX *= -1;
      }
      // Bounce off bot paddle
      if (ballX === width - 3 && ballY >= botPaddleY && ballY < botPaddleY + paddleHeight) {
        ballVX *= -1;
      }
      // Player scores
      if (ballX === width - 1) {
        playerScore++;
        ballX = Math.floor(width / 2);
        ballY = Math.floor(height / 2);
        ballVX = -1;
        ballVY = Math.random() > 0.5 ? 1 : -1;
      }
      // Bot scores
      if (ballX === 0) {
        botScore++;
        ballX = Math.floor(width / 2);
        ballY = Math.floor(height / 2);
        ballVX = 1;
        ballVY = Math.random() > 0.5 ? 1 : -1;
      }
      // End game if either reaches 11
      if (playerScore >= 11 || botScore >= 11) {
        running = false;
      }
    }

    function onKeypress(chunk) {
      const key = chunk.toString();
      if (key === '\u001b[A' && paddleY > 0) paddleY--; // Up arrow
      if (key === '\u001b[B' && paddleY < height - paddleHeight) paddleY++; // Down arrow
      if (key === 'q' || key === '\u0003') { // Ctrl+C or q
        running = false;
      }
    }

    process.stdin.on('data', onKeypress);

    function gameLoop() {
      if (!running) {
        process.stdin.setRawMode(false);
        rl.close();
        if (playerScore >= 11) {
          process.stdout.write('You win! Final Score: ' + playerScore + ' - ' + botScore + '\n');
        } else if (botScore >= 11) {
          process.stdout.write('Bot wins! Final Score: ' + playerScore + ' - ' + botScore + '\n');
        } else {
          process.stdout.write('Game Over! Final Score: ' + playerScore + ' - ' + botScore + '\n');
        }
        // Ask if user wants to clear the terminal
        const promptRl = readline.createInterface({ input: process.stdin, output: process.stdout });
        promptRl.question('Do you want to clear the terminal? (y/N): ', (answer) => {
          if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes') {
            process.stdout.write('\x1Bc');
          }
          promptRl.close();
        });
        return;
      }
      update();
      draw();
      setTimeout(gameLoop, 80);
    }
    draw();
    gameLoop();
  });

program
  .command('random-int [min] [max]')
  .description('Print a random integer between min and max (defaults: 0 100)')
  .action((min, max) => {
    let minVal = 0, maxVal = 100;
    if (min !== undefined && max === undefined) {
      maxVal = parseInt(min);
    } else if (min !== undefined && max !== undefined) {
      minVal = parseInt(min);
      maxVal = parseInt(max);
    }
    if (isNaN(minVal) || isNaN(maxVal)) {
      console.log('Usage: random-int [min] [max] (defaults to 0 100)');
      process.exit(1);
    }
    console.log(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
  });

program
  .command('date')
  .description('Show the current date and time, updating every second. Press ^C to exit.')
  .action(() => {
    console.log('Press ^C to exit');
    function printTime() {
      process.stdout.write('\r' + new Date().toLocaleString() + '       ');
    }
    printTime();
    const interval = setInterval(printTime, 1000);
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.stdout.write('\n');
      process.exit();
    });
  });

program
  .command('mathjs <expression...>')
  .description('Evaluate a mathematical expression with mathjs')
  .action((expression) => {
    if (!expression || expression.length === 0) {
      console.log('Usage: mathjs <expression>');
      process.exit(1);
    }
    const expr = expression.join(' ');
    try {
      const result = math.evaluate(expr);
      console.log(result);
    } catch (e) {
      console.log('Invalid expression.');
      process.exit(1);
    }
  });

program
  .command('cal')
  .description('Show the current month calendar with today highlighted')
  .action(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    console.log(`\n   ${now.toLocaleString('default', { month: 'long' })} ${year}`);
    console.log('Su Mo Tu We Th Fr Sa');
    let line = '   '.repeat(firstDay);
    for (let day = 1; day <= daysInMonth; day++) {
      let dayStr = day.toString().padStart(2, ' ');
      if (day === now.getDate()) {
        dayStr = chalk.bgWhite.black.bold(dayStr);
      }
      line += dayStr + ' ';
      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        console.log(line.trimEnd());
        line = '';
      }
    }
  });

program
  .command('cli-stats')
  .description('Show CLI project stats and usage count')
  .action(() => {
    import('fs').then(fs => {
      import('path').then(path => {
        import('os').then(os => {
          const pkgPath = path.resolve('package.json');
          const lockPath = path.resolve('package-lock.json');
          const statsPath = path.join(os.homedir(), '.simple-cli-stats.json');
          let stats = { cliStatsRuns: 0 };
          try {
            if (fs.existsSync(statsPath)) {
              stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
            }
          } catch {}
          stats.cliStatsRuns = (stats.cliStatsRuns || 0) + 1;
          fs.writeFileSync(statsPath, JSON.stringify(stats), 'utf8');
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
          console.log('--- CLI Project Stats ---');
          console.log(`Name:        ${pkg.name}`);
          console.log(`Version:     ${pkg.version}`);
          console.log(`Description: ${pkg.description}`);
          console.log(`Author:      ${pkg.author}`);
          console.log(`License:     ${pkg.license}`);
          console.log(`Lockfile:    v${lock.lockfileVersion}`);
          console.log('\nDependencies:');
          for (const dep in pkg.dependencies) {
            const depLock = lock.packages && lock.packages[`node_modules/${dep}`];
            const resolved = depLock ? depLock.version : pkg.dependencies[dep];
            console.log(`- ${dep}: ${resolved}`);
          }
          if (stats.cliStatsRuns === 1) {
            console.log(`\ncli-stats has been run on this user and device 1 time.`);
          } else {
            console.log(`\ncli-stats has been run on this user and device ${stats.cliStatsRuns} times.`);
          }
        });
      });
    });
  });

program
  .command('my-info')
  .description('Show information about your device and terminal')
  .action(() => {
    import('os').then(os => {
      const platform = os.platform();
      const arch = os.arch();
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const userInfo = os.userInfo();
      const shell = process.env.SHELL || process.env.ComSpec || 'unknown';
      const term = process.env.TERM || 'unknown';
      const nodeVersion = process.version;
      console.log('--- My Device & Terminal Info ---');
      console.log(`User:        ${userInfo.username}`);
      console.log(`OS:          ${platform} (${arch})`);
      console.log(`CPU:         ${cpus[0].model} (${cpus.length} cores)`);
      console.log(`Memory:      ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB total, ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB free`);
      console.log(`Shell:       ${shell}`);
      console.log(`Terminal:    ${term}`);
      console.log(`Node.js:     ${nodeVersion}`);
    });
  });

program.parse(process.argv);
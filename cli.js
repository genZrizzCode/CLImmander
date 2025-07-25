#!/usr/bin/env node

import https from 'https';
import chalk from 'chalk';
import { Command } from 'commander';
import { create, all as mathAll } from 'mathjs';
const math = create(mathAll);
const program = new Command();

import fs from 'fs';
import path from 'path';
import os from 'os';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));

program
  .name('order')
  .description('Order CLI for various commands')
  .version(pkg.version);

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
  .command('pong [difficulty]')
  .description('Play a simple Pong game in your terminal (difficulty: easy, medium, hard)')
  .action(async (difficulty) => {
    if (!difficulty) {
      console.log('Usage: order pong <difficulty>\nDifficulty must be one of: easy, medium, hard');
      process.exit(1);
    }
    // Basic terminal Pong using Node.js built-ins
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    if (!process.stdin.isTTY) {
      console.log('Pong requires an interactive terminal (TTY). Please run this command directly in your terminal.');
      rl.close();
      return;
    }
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

    // Difficulty settings
    let botSpeed = 1;
    let botMistakeChance = 0;
    let ballDelay = 100;
    if (difficulty === 'easy') {
      botSpeed = 1.3;
      botMistakeChance = 0.5;
      ballDelay = 140;
    } else if (difficulty === 'medium') {
      botSpeed = 1;
      botMistakeChance = 0.25;
      ballDelay = 100;
    } else if (difficulty === 'hard') {
      botSpeed = 1.5;
      botMistakeChance = 0.125;
      ballDelay = 80;
    } else if (difficulty === 'impossible') {
      botSpeed = 1.5;
      botMistakeChance = 0;
      ballDelay = 70;
    }

    function draw() {
      let out = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x === 1 && y >= paddleY && y < paddleY + paddleHeight) {
            out += '█'; // Player Paddle
          } else if (x === width - 2 && y >= botPaddleY && y < botPaddleY + paddleHeight) {
            out += '█'; // Bot Paddle
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
      // Bot AI: move paddle towards ball, with mistakes
      let botTarget = ballY - Math.floor(paddleHeight / 2);
      let move = Math.sign(botTarget - botPaddleY) * botSpeed;
      let shouldMove = true;
      if (botMistakeChance > 0 && Math.random() < botMistakeChance) {
        shouldMove = false; // bot makes a mistake
      }
      if (shouldMove && Math.abs(move) > 0 && Math.abs(botTarget - botPaddleY) >= 1) {
        botPaddleY += move;
        botPaddleY = Math.max(0, Math.min(height - paddleHeight, Math.round(botPaddleY)));
      }
      // Bounce off top/bottom
      if (ballY <= 0 || ballY >= height - 1) ballVY *= -1;
      // Bounce off player paddle
      if (ballX === 2 && ballY >= paddleY && ballY < paddleY + paddleHeight) {
        ballVX *= -1;
        // Always bounce at least 15 degrees from horizontal
        let minAngle = Math.PI / 12; // 15 degrees
        let angle = (Math.random() - 0.5) * (Math.PI / 2 - 2 * minAngle) + (ballY - (paddleY + paddleHeight / 2)) * 0.2;
        angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angle)); // Clamp to ±45°
        angle += (angle > 0 ? 1 : -1) * minAngle; // Nudge away from horizontal
        let speed = 1 + Math.random();
        ballVX = Math.sign(ballVX) * Math.max(1, Math.round(Math.abs(Math.cos(angle) * speed)));
        ballVY = Math.sign(ballVY || 1) * Math.max(1, Math.round(Math.abs(Math.sin(angle) * speed)));
      }
      // Bounce off bot paddle
      if (ballX === width - 3 && ballY >= botPaddleY && ballY < botPaddleY + paddleHeight) {
        ballVX *= -1;
        let minAngle = Math.PI / 12;
        let angle = (Math.random() - 0.5) * (Math.PI / 2 - 2 * minAngle) + (ballY - (botPaddleY + paddleHeight / 2)) * 0.2;
        angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angle));
        angle += (angle > 0 ? 1 : -1) * minAngle;
        let speed = 1 + Math.random();
        ballVX = Math.sign(ballVX) * Math.max(1, Math.round(Math.abs(Math.cos(angle) * speed)));
        ballVY = Math.sign(ballVY || 1) * Math.max(1, Math.round(Math.abs(Math.sin(angle) * speed)));
      }
      // Player scores
      if (ballX >= width - 1) {
        playerScore++;
        ballX = Math.floor(width / 2);
        ballY = Math.floor(height / 2);
        ballVX = -1;
        ballVY = (Math.random() > 0.5 ? 1 : -1);
        return; // Prevent further update this frame
      }
      // Bot scores
      if (ballX <= 0) {
        botScore++;
        ballX = Math.floor(width / 2);
        ballY = Math.floor(height / 2);
        ballVX = 1;
        ballVY = (Math.random() > 0.5 ? 1 : -1);
        return; // Prevent further update this frame
      }
      // End game if either reaches 5
      if (playerScore >= 5 || botScore >= 5) {
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
        if (playerScore >= 5) {
          process.stdout.write('You win! Final Score: ' + playerScore + ' - ' + botScore + '\n');
        } else if (botScore >= 5) {
          process.stdout.write('Bot wins! Final Score: ' + playerScore + ' - ' + botScore + '\n');
        } else {
          process.stdout.write('Game Over! Final Score: ' + playerScore + ' - ' + botScore + '\n');
        }
        // Ask if user wants to clear the terminal
        const promptRl = readline.createInterface({ input: process.stdin, output: process.stdout });
        promptRl.question('\nDo you want to clear the terminal? (y/N): ', (answer) => {
          if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes') {
            process.stdout.write('\x1Bc');
          }
          promptRl.close();
        });
        return;
      }
      update();
      draw();
      setTimeout(gameLoop, ballDelay);
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
      const osType = os.type();
      const osRelease = os.release();
      console.log('--- My Device & Terminal Info ---');
      console.log(`User:        ${userInfo.username}`);
      console.log(`OS:          ${platform} (${arch})`);
      console.log(`OS Type:     ${osType}`);
      console.log(`OS Release:  ${osRelease}`);
      // Try to get device model for macOS, Windows, and Linux
      const macModelMap = {
        // MacBook
        'MacBook8,1': 'MacBook (Retina, 12-inch, Early 2015)',
        'MacBook9,1': 'MacBook (Retina, 12-inch, Early 2016)',
        'MacBook10,1': 'MacBook (Retina, 12-inch, 2017)',
        // MacBook Air
        'MacBookAir7,2': 'MacBook Air (13-inch, Early 2015/2017)',
        'MacBookAir8,1': 'MacBook Air (Retina, 13-inch, 2018)',
        'MacBookAir8,2': 'MacBook Air (Retina, 13-inch, 2019)',
        'MacBookAir9,1': 'MacBook Air (Retina, 13-inch, 2020)',
        'MacBookAir10,1': 'MacBook Air (M1, 2020)',
        'MacBookAir10,2': 'MacBook Air (M2, 2022)',
        'MacBookAir15,3': 'MacBook Air (15-inch, M2, 2023)',
        // MacBook Pro
        'MacBookPro13,1': 'MacBook Pro (13-inch, 2016, Two Thunderbolt 3 ports)',
        'MacBookPro13,2': 'MacBook Pro (13-inch, 2016, Four Thunderbolt 3 ports)',
        'MacBookPro13,3': 'MacBook Pro (15-inch, 2016)',
        'MacBookPro14,1': 'MacBook Pro (13-inch, 2017, Two Thunderbolt 3 ports)',
        'MacBookPro14,2': 'MacBook Pro (13-inch, 2017, Four Thunderbolt 3 ports)',
        'MacBookPro14,3': 'MacBook Pro (15-inch, 2017)',
        'MacBookPro15,1': 'MacBook Pro (15-inch, 2018/2019)',
        'MacBookPro15,2': 'MacBook Pro (13-inch, 2018/2019, Four Thunderbolt 3 ports)',
        'MacBookPro15,4': 'MacBook Pro (13-inch, 2019, Two Thunderbolt 3 ports)',
        'MacBookPro16,1': 'MacBook Pro (16-inch, 2019)',
        'MacBookPro16,2': 'MacBook Pro (13-inch, 2020, Four Thunderbolt 3 ports)',
        'MacBookPro16,3': 'MacBook Pro (13-inch, 2020, Two Thunderbolt 3 ports)',
        'MacBookPro16,4': 'MacBook Pro (16-inch, 2019, AMD Radeon Pro 5600M)',
        'MacBookPro17,1': 'MacBook Pro (13-inch, M1, 2020)',
        'MacBookPro18,1': 'MacBook Pro (16-inch, 2021, M1 Pro/Max)',
        'MacBookPro18,2': 'MacBook Pro (16-inch, 2021, M1 Pro/Max)',
        'MacBookPro18,3': 'MacBook Pro (14-inch, 2021, M1 Pro/Max)',
        'MacBookPro18,4': 'MacBook Pro (14-inch, 2021, M1 Pro/Max)',
        'MacBookPro20,1': 'MacBook Pro (14-inch, M2 Pro/Max, 2023)',
        'MacBookPro20,2': 'MacBook Pro (16-inch, M2 Pro/Max, 2023)',
        // iMac
        'iMac14,2': 'iMac (27-inch, Late 2013)',
        'iMac15,1': 'iMac (Retina 5K, 27-inch, Late 2014/Mid 2015)',
        'iMac16,1': 'iMac (21.5-inch, Late 2015)',
        'iMac16,2': 'iMac (Retina 4K, 21.5-inch, Late 2015)',
        'iMac17,1': 'iMac (Retina 5K, 27-inch, Late 2015)',
        'iMac18,1': 'iMac (21.5-inch, 2017)',
        'iMac18,2': 'iMac (Retina 4K, 21.5-inch, 2017)',
        'iMac18,3': 'iMac (Retina 5K, 27-inch, 2017)',
        'iMac19,1': 'iMac (Retina 5K, 27-inch, 2019)',
        'iMac19,2': 'iMac (Retina 4K, 21.5-inch, 2019)',
        'iMac20,1': 'iMac (Retina 5K, 27-inch, 2020)',
        'iMac20,2': 'iMac (Retina 5K, 27-inch, 2020)',
        'iMac21,1': 'iMac (24-inch, M1, 2021)',
        'iMac21,2': 'iMac (24-inch, M1, 2021)',
        // Mac mini
        'Macmini7,1': 'Mac mini (Late 2014)',
        'Macmini8,1': 'Mac mini (2018)',
        'Macmini9,1': 'Mac mini (M1, 2020)',
        'Mac14,3': 'Mac mini (M2, 2023)',
        // Mac Studio
        'Mac13,1': 'Mac Studio (M1 Max, 2022)',
        'Mac13,2': 'Mac Studio (M1 Ultra, 2022)',
        // Mac Pro
        'MacPro6,1': 'Mac Pro (Late 2013)',
        'MacPro7,1': 'Mac Pro (2019)',
        // Xserve
        'Xserve3,1': 'Xserve (Early 2009)',
        // Add more as needed
      };
      const pcBrandMap = {
        'Dell': 'Dell PC',
        'LG': 'LG PC',
        'ASUS': 'ASUS PC',
        'Samsung': 'Samsung PC',
        'MSI': 'MSI PC',
      };
      if (platform === 'darwin') {
        import('child_process').then(cp => {
          // Get macOS version
          cp.exec('sw_vers -productVersion', (verr, vstdout) => {
            let macosVersion = vstdout ? vstdout.toString().trim() : '';
            let marketingName = '';
            // Map major versions to marketing names
            const macosNames = {
              '10.15': 'Catalina',
              '11': 'Big Sur',
              '12': 'Monterey',
              '13': 'Ventura',
              '14': 'Sonoma',
              '15': 'Sequoia',
              '26': 'Tahoe', // Upcoming macOS Tahoe 26
            };
            let major = macosVersion.split('.').slice(0,2).join('.');
            if (major.startsWith('10.15')) marketingName = 'Catalina';
            else if (major.startsWith('11')) marketingName = 'Big Sur';
            else if (major.startsWith('12')) marketingName = 'Monterey';
            else if (major.startsWith('13')) marketingName = 'Ventura';
            else if (major.startsWith('14')) marketingName = 'Sonoma';
            else if (major.startsWith('15')) marketingName = 'Sequoia';
            else if (major.startsWith('26')) marketingName = 'Tahoe';
            else marketingName = '';
            let macosString = macosVersion;
            if (marketingName) macosString = `macOS ${marketingName} ${macosVersion}`;
            // Get model
            cp.exec('system_profiler SPHardwareDataType | grep "Model Identifier"', (err, stdout) => {
              if (!err && stdout) {
                const modelId = stdout.toString().trim().split(':').pop().trim();
                const marketing = macModelMap[modelId] || 'Unknown Mac model';
                console.log(`Device:      ${marketing} (${modelId})`);
              } else {
                console.log('Device:      (unknown Mac model)');
              }
              // Show macOS version
              console.log(`macOS:       ${macosString}`);
              printRest();
            });
          });
        });
      } else if (platform === 'win32') {
        import('child_process').then(cp => {
          cp.exec('wmic computersystem get manufacturer,model', (err, stdout) => {
            if (!err && stdout) {
              const lines = stdout.trim().split('\n');
              if (lines.length > 1) {
                const info = lines[1].trim().replace(/\s+/g, ' ');
                let brand = Object.keys(pcBrandMap).find(b => info.toLowerCase().includes(b.toLowerCase()));
                if (brand) {
                  let marketing = pcBrandMap[brand];
                  console.log(`Device:      ${marketing} (${info})`);
                } else {
                  console.log(`Device:      ${info}`);
                }
              } else {
                console.log('Device:      (unknown Windows model)');
              }
            } else {
              console.log('Device:      (unknown Windows model)');
            }
            printRest();
          });
        });
      } else if (platform === 'linux') {
        import('child_process').then(cp => {
          cp.exec('cat /sys/class/dmi/id/sys_vendor 2>/dev/null; cat /sys/class/dmi/id/product_name 2>/dev/null', (err, stdout) => {
            if (!err && stdout) {
              const lines = stdout.trim().split('\n');
              let vendor = lines[0] || '';
              let model = lines[1] || '';
              let device = (vendor + ' ' + model).trim();
              if (device) {
                const brands = Object.keys(pcBrandMap);
                let found = brands.find(b => device.toLowerCase().includes(b.toLowerCase()));
                if (found) {
                  let marketing = pcBrandMap[found];
                  console.log(`Device:      ${marketing} (${device})`);
                } else {
                  console.log(`Device:      ${device}`);
                }
              } else {
                console.log('Device:      (unknown Linux model)');
              }
            } else {
              console.log('Device:      (unknown Linux model)');
            }
            printRest();
          });
        });
      } else {
        console.log('Device:      (detection not supported on this OS)');
        printRest();
      }
      function printRest() {
        console.log(`CPU:         ${cpus[0].model} (${cpus.length} cores)`);
        console.log(`Memory:      ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB total, ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB free`);
        console.log(`Shell:       ${shell}`);
        console.log(`Terminal:    ${term}`);
        console.log(`Node.js:     ${nodeVersion}`);
      }
    });
  });

program.parse(process.argv);
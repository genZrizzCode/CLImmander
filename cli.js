#!/usr/bin/env node

import https from 'https';
import chalk from 'chalk';
import { Command } from 'commander';
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

program.parse(process.argv);
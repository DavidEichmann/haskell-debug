"use strict";
const cp = require("child_process");
const net = require("net");
const os = require("os");
const util = require("util");
const atomAPI = require("atom");
const PIPE_PATH = 'haskell-debug';
class TerminalReporter {
    constructor() {
        this.emitter = new atomAPI.Emitter();
        this.on = this.emitter.on.bind(this.emitter);
        this.streamData = '';
        this.totalData = '';
        const connectionPath = os.platform() === 'win32' ?
            '\\\\.\\pipe\\' + PIPE_PATH : `/tmp/${PIPE_PATH}.sock`;
        const terminalEchoPath = `${__dirname}/../bin/TerminalEcho.js`;
        this.server = net.createServer((socket) => {
            this.socket = socket;
            if (this.streamData !== '') {
                this.socket.write(this.streamData);
            }
            socket.on('data', (data) => this.onData(data));
            socket.on('end', () => {
                this.emitter.emit('close', undefined);
            });
        });
        this.server.listen(connectionPath, () => {
            if (atom.config.get('haskell-debug.showTerminal')) {
                const nodeCommand = `${atom.config.get('haskell-debug.nodeCommand')} ${terminalEchoPath}`;
                const commandToRun = util.format(atom.config.get('haskell-debug.terminalCommand'), nodeCommand);
                this.process = cp.exec(commandToRun);
            }
        });
    }
    destroy() {
        if (this.process) {
            this.send({
                type: 'close',
            });
            this.process.kill();
        }
        this.server.close();
    }
    prompt() {
        this.send({
            type: 'user-input',
        });
    }
    write(output) {
        this.send({
            type: 'message',
            content: output,
        });
    }
    displayCommand(command) {
        this.send({
            type: 'display-command',
            command,
        });
    }
    send(data) {
        try {
            const sendingData = JSON.stringify(data) + '\n';
            if (this.socket === undefined) {
                this.streamData += sendingData;
            }
            else {
                this.socket.write(sendingData);
            }
        }
        catch (e) {
        }
    }
    onData(data) {
        const newLinePos = data.indexOf('\n');
        if (newLinePos !== -1) {
            this.totalData += data.slice(0, newLinePos);
            this.emitter.emit('command', this.totalData);
            this.totalData = '';
            this.onData(data.slice(newLinePos + 1));
        }
        else {
            this.totalData += data;
        }
    }
}
module.exports = TerminalReporter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVybWluYWxSZXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvVGVybWluYWxSZXBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsb0NBQW9DO0FBQ3BDLDJCQUEyQjtBQUMzQix5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQUdoQyxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUE7QUFFakM7SUFjRTtRQWJRLFlBQU8sR0FHVixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUVWLE9BQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBSy9DLGVBQVUsR0FBRyxFQUFFLENBQUE7UUFDZixjQUFTLEdBQUcsRUFBRSxDQUFBO1FBR3BCLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxPQUFPO1lBQzlDLGVBQWUsR0FBRyxTQUFTLEdBQUcsUUFBUSxTQUFTLE9BQU8sQ0FBQTtRQUN4RCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsU0FBUyx5QkFBeUIsQ0FBQTtRQUU5RCxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNO1lBQ3BDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQ3BDLENBQUM7WUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7WUFDOUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVB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LENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFBO1FBQ3hCLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxpQkFBUyxnQkFBZ0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0IG5ldCA9IHJlcXVpcmUoJ25ldCcpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcbmltcG9ydCB7IE1lc3NhZ2UgfSBmcm9tICcuLi9iaW4vbWVzc2FnZSdcblxuY29uc3QgUElQRV9QQVRIID0gJ2hhc2tlbGwtZGVidWcnXG5cbmNsYXNzIFRlcm1pbmFsUmVwb3J0ZXIge1xuICBwcml2YXRlIGVtaXR0ZXI6IGF0b21BUEkuVEVtaXR0ZXI8e1xuICAgICdjb21tYW5kJzogc3RyaW5nXG4gICAgJ2Nsb3NlJzogdW5kZWZpbmVkXG4gIH0+ID0gbmV3IGF0b21BUEkuRW1pdHRlcigpXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWVtYmVyLW9yZGVyaW5nXG4gIHB1YmxpYyByZWFkb25seSBvbiA9IHRoaXMuZW1pdHRlci5vbi5iaW5kKHRoaXMuZW1pdHRlcilcblxuICBwcml2YXRlIHByb2Nlc3M/OiBjcC5DaGlsZFByb2Nlc3NcbiAgcHJpdmF0ZSBzZXJ2ZXI6IG5ldC5TZXJ2ZXJcbiAgcHJpdmF0ZSBzb2NrZXQ/OiBuZXQuU29ja2V0XG4gIHByaXZhdGUgc3RyZWFtRGF0YSA9ICcnXG4gIHByaXZhdGUgdG90YWxEYXRhID0gJydcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBjb25zdCBjb25uZWN0aW9uUGF0aCA9IG9zLnBsYXRmb3JtKCkgPT09ICd3aW4zMicgP1xuICAgICAgJ1xcXFxcXFxcLlxcXFxwaXBlXFxcXCcgKyBQSVBFX1BBVEggOiBgL3RtcC8ke1BJUEVfUEFUSH0uc29ja2BcbiAgICBjb25zdCB0ZXJtaW5hbEVjaG9QYXRoID0gYCR7X19kaXJuYW1lfS8uLi9iaW4vVGVybWluYWxFY2hvLmpzYFxuXG4gICAgdGhpcy5zZXJ2ZXIgPSBuZXQuY3JlYXRlU2VydmVyKChzb2NrZXQpID0+IHtcbiAgICAgIHRoaXMuc29ja2V0ID0gc29ja2V0XG4gICAgICBpZiAodGhpcy5zdHJlYW1EYXRhICE9PSAnJykge1xuICAgICAgICB0aGlzLnNvY2tldC53cml0ZSh0aGlzLnN0cmVhbURhdGEpXG4gICAgICB9XG4gICAgICBzb2NrZXQub24oJ2RhdGEnLCAoZGF0YSkgPT4gdGhpcy5vbkRhdGEoZGF0YSkpXG4gICAgICBzb2NrZXQub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Nsb3NlJywgdW5kZWZpbmVkKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5zZXJ2ZXIubGlzdGVuKGNvbm5lY3Rpb25QYXRoLCAoKSA9PiB7XG4gICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLnNob3dUZXJtaW5hbCcpKSB7XG4gICAgICAgIGNvbnN0IG5vZGVDb21tYW5kID0gYCR7YXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLm5vZGVDb21tYW5kJyl9ICR7dGVybWluYWxFY2hvUGF0aH1gXG4gICAgICAgIGNvbnN0IGNvbW1hbmRUb1J1biA9IHV0aWwuZm9ybWF0KGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy50ZXJtaW5hbENvbW1hbmQnKSwgbm9kZUNvbW1hbmQpXG5cbiAgICAgICAgdGhpcy5wcm9jZXNzID0gY3AuZXhlYyhjb21tYW5kVG9SdW4pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLnByb2Nlc3MpIHtcbiAgICAgIHRoaXMuc2VuZCh7XG4gICAgICAgIHR5cGU6ICdjbG9zZScsXG4gICAgICB9KVxuICAgICAgdGhpcy5wcm9jZXNzLmtpbGwoKVxuICAgIH1cbiAgICB0aGlzLnNlcnZlci5jbG9zZSgpXG4gIH1cblxuICBwdWJsaWMgcHJvbXB0KCkge1xuICAgIHRoaXMuc2VuZCh7XG4gICAgICB0eXBlOiAndXNlci1pbnB1dCcsXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyB3cml0ZShvdXRwdXQ6IHN0cmluZykge1xuICAgIHRoaXMuc2VuZCh7XG4gICAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgICBjb250ZW50OiBvdXRwdXQsXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwbGF5Q29tbWFuZChjb21tYW5kOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNlbmQoe1xuICAgICAgdHlwZTogJ2Rpc3BsYXktY29tbWFuZCcsXG4gICAgICBjb21tYW5kLFxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIHNlbmQoZGF0YTogTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZW5kaW5nRGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpICsgJ1xcbidcblxuICAgICAgaWYgKHRoaXMuc29ja2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zdHJlYW1EYXRhICs9IHNlbmRpbmdEYXRhXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNvY2tldC53cml0ZShzZW5kaW5nRGF0YSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBpZ25vcmUgZXJyb3NcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uRGF0YShkYXRhOiBCdWZmZXIpIHtcbiAgICBjb25zdCBuZXdMaW5lUG9zID0gZGF0YS5pbmRleE9mKCdcXG4nKVxuICAgIGlmIChuZXdMaW5lUG9zICE9PSAtMSkge1xuICAgICAgdGhpcy50b3RhbERhdGEgKz0gZGF0YS5zbGljZSgwLCBuZXdMaW5lUG9zKVxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbW1hbmQnLCB0aGlzLnRvdGFsRGF0YSlcbiAgICAgIHRoaXMudG90YWxEYXRhID0gJydcbiAgICAgIHRoaXMub25EYXRhKGRhdGEuc2xpY2UobmV3TGluZVBvcyArIDEpKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRvdGFsRGF0YSArPSBkYXRhXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCA9IFRlcm1pbmFsUmVwb3J0ZXJcbiJdfQ==
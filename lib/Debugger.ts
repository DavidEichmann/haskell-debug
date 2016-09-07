import atomAPI = require("atom");
import _GHCIDebug = require("./GHCIDebug");
import DebugView = require("./views/DebugView");
import CurrentVariablesView = require("./views/CurrentVariablesView");
import BreakpointUI = require("./BreakpointUI");
import HistoryState = require("./HistoryState");
import LineHighlighter = require("./LineHighlighter");
import TerminalReporter = require("./TerminalReporter");
import GHCIDebug = _GHCIDebug.GHCIDebug;
import BreakInfo = _GHCIDebug.BreakInfo;
import ExceptionInfo = _GHCIDebug.ExceptionInfo;

class Debugger{
    private lineHighlighter = new LineHighlighter();
    private ghciDebug = new GHCIDebug();
    private debugView = new DebugView();
    private historyState = new HistoryState();
    private debugPanel: AtomCore.Panel;
    private currentVariablesView = new CurrentVariablesView();
    private currentVariablesPanel: AtomCore.Panel;
    private terminalReporter = new TerminalReporter();
    private disposables = new atomAPI.CompositeDisposable();

    private destroy(){
        this.lineHighlighter.destroy();
        if(this.ghciDebug)
            this.ghciDebug.destroy();
        this.debugView.destroy();
        this.debugPanel.destroy();
        this.currentVariablesPanel.destroy();
        this.currentVariablesView.destroy();
        this.terminalReporter.destroy();
        this.disposables.dispose();
    }

    hidePanels(){
        this.debugPanel.hide();
        this.currentVariablesPanel.hide();
    }

    showPanels(){
        this.debugPanel.show();
        this.currentVariablesPanel.show();
    }

    private displayGUI(){
        this.debugView = new DebugView();
        this.debugPanel = atom.workspace.addTopPanel({
            item: this.debugView.element
        });

        this.debugView.emitter.on("step", () => this.step());
        this.debugView.emitter.on("back", () => this.back());
        this.debugView.emitter.on("forward", () => this.forward());
        this.debugView.emitter.on("continue", () => this.continue());
        this.debugView.emitter.on("stop", () => this.stop());

        this.currentVariablesView = new CurrentVariablesView();
        this.currentVariablesPanel = atom.workspace.addTopPanel({
            item: this.currentVariablesView.element
        });
    }

    private debuggerEnabled = false;

    private updateHistoryLengthAndEnableButtons(historyLength: number){
        if(historyLength !== undefined){
            this.historyState.setMaxPosition(historyLength);
        }

        this.debugView.enableAllDebugButtons();
        this.debugView.buttons.back.isEnabled = this.historyState.backEnabled;
        this.debugView.buttons.forward.isEnabled = this.historyState.forwardEnabled;
        this.debuggerEnabled = true;
    }

    private executingCommandFromConsole = false;
    private launchGHCIDebugAndConsole(breakpoints: Map<number, Breakpoint>){
        this.ghciDebug.emitter.on("line-changed", (info: BreakInfo) => {
            this.lineHighlighter.hightlightLine(info);
            this.updateHistoryLengthAndEnableButtons(info.historyLength);
            this.currentVariablesView.update(info.localBindings, false);
        })

        this.ghciDebug.emitter.on("paused-on-exception", (info: ExceptionInfo) => {
            this.lineHighlighter.destroy();
            this.updateHistoryLengthAndEnableButtons(info.historyLength);
            this.currentVariablesView.update(info.localBindings, true);
        })

        this.ghciDebug.emitter.on("debug-finished", () => {
            this.ghciDebug = null;
            this.destroy()
        })

        this.ghciDebug.emitter.on("command-issued", (command) => {
            if(!this.executingCommandFromConsole)
                this.terminalReporter.displayCommand(command);

            this.debuggerEnabled = false;
            setTimeout(() => {
                if(!this.debuggerEnabled)
                    this.debugView.disableAllDebugButtons();
            }, 100);
        })

        this.ghciDebug.emitter.on("console-output", (output) => {
            this.terminalReporter.write(output);
            console.log(output);
        })

        this.ghciDebug.emitter.on("error-completed", (errorText) => {
            if(!this.executingCommandFromConsole)
                atom.notifications.addError("GHCI Error", {
                    detail: errorText,
                    dismissable: true
                })
        })

        this.ghciDebug.emitter.on("error", (errorText) => {
            this.terminalReporter.write(errorText);
        })

        this.ghciDebug.addedAllListeners();

        this.terminalReporter.emitter.on("command", async command => {
            this.executingCommandFromConsole = true;
            await this.ghciDebug.run(command, true, true);
            this.executingCommandFromConsole = false;
        })

        this.terminalReporter.emitter.on("close", () => {
            this.ghciDebug.stop();
        })

        this.ghciDebug.setExceptionBreakLevel(atom.config.get("haskell-debug.breakOnException"));

        this.debugView.disableAllDebugButtons();

        var fileToDebug = atom.workspace.getActiveTextEditor().getPath()
        this.ghciDebug.loadModule(fileToDebug);

        breakpoints.forEach(ob => {
            if(ob.file == fileToDebug)
                this.ghciDebug.addBreakpoint(ob.line.toString());
            else
                this.ghciDebug.addBreakpoint(ob) //TODO: make this work properly
        });

        this.ghciDebug.startDebug();
    }

    constructor(breakpoints: Map<number, Breakpoint>){
        this.launchGHCIDebugAndConsole(breakpoints);
        this.displayGUI();
        this.disposables.add(atom.config.onDidChange("haskell-debug.breakOnException", ({newValue}) => {
            this.ghciDebug.setExceptionBreakLevel(<ExceptionBreakLevels> newValue);
        }));
    }

    /** For the tooltip override*/
    async resolveExpression(expression: string){
        return this.ghciDebug.resolveExpression(expression);
    }

    back(){
        if(this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() + 1))
            this.ghciDebug.back();
    }

    forward(){
        if(this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() - 1))
            this.ghciDebug.forward();
    }

    continue(){
        this.ghciDebug.continue();
    }

    step(){
        this.ghciDebug.step();
    }

    stop(){
        this.ghciDebug.stop(); // this will trigger debug-finished event
    }
}

export = Debugger;

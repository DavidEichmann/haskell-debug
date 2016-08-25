"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const atomAPI = require("atom");
class TooltipManager {
    constructor(resolveExpression) {
        this.resolveExpression = resolveExpression;
    }
    consumeHaskellUpi(_upi) {
        var pluginDisposable = new atomAPI.CompositeDisposable();
        var upi = _upi.registerPlugin(pluginDisposable);
        console.log(upi);
        var prevShowTooltip = upi.showTooltip;
        var _this = this;
        upi["__proto__"].showTooltip = function (arg) {
            var prevTooltipFunc = arg.tooltip;
            arg.tooltip = (range) => __awaiter(this, void 0, void 0, function* () {
                var tooltipAndRange = yield prevTooltipFunc(range);
                var tooltip = tooltipAndRange.text;
                var debugValue = yield _this.resolveExpression(arg.editor.getTextInRange(tooltipAndRange.range));
                if (debugValue !== null && typeof (tooltip) == "object" && tooltip["text"] !== undefined) {
                    tooltip["text"] = `--type ${tooltip["text"]}\n--current debug value ${debugValue}"`;
                }
                return tooltipAndRange;
            });
            prevShowTooltip.call(this, arg);
        };
    }
}
module.exports = TooltipManager;
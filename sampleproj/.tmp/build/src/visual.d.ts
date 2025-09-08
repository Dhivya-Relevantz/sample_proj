import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private chatContainer;
    private messagesArea;
    private inputBox;
    private sendButton;
    private optionDropdown;
    private fileInput;
    private fileLabel;
    private formattingSettings;
    private formattingSettingsService;
    private latestDataViews;
    constructor(options: VisualConstructorOptions);
    private handleSend;
    private renderBarChart;
    private renderColumnChart;
    private renderPieChart;
    private renderScatterChart;
    update(options: VisualUpdateOptions): void;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}

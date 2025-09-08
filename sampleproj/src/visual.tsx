import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private chatContainer: HTMLElement;
    private messagesArea: HTMLElement;
    private inputBox: HTMLInputElement;
    private sendButton: HTMLButtonElement;
    private optionDropdown: HTMLSelectElement;
    private fileInput: HTMLInputElement;
    private fileLabel: HTMLSpanElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private latestDataViews: powerbi.DataView[] = [];

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.target.innerHTML = "";

        // Chat container
        this.chatContainer = document.createElement("div");
        this.chatContainer.className = "chatbot-container";

        // Messages area
        this.messagesArea = document.createElement("div");
        this.messagesArea.className = "chatbot-messages";
        this.chatContainer.appendChild(this.messagesArea);

        // Input area
        const inputArea = document.createElement("div");
        inputArea.className = "chatbot-input-area";

        // Textbox
        this.inputBox = document.createElement("input");
        this.inputBox.type = "text";
        this.inputBox.placeholder = "Ask your question...";

        // Dropdown
        this.optionDropdown = document.createElement("select");
        this.optionDropdown.className = "chatbot-dropdown";
        ["General", "Dataset", "File"].forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.text = opt;
            this.optionDropdown.appendChild(option);
        });

        // File input
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.style.display = "none";
        this.fileInput.onchange = () => {
            if (this.fileInput.files && this.fileInput.files.length > 0) {
                this.fileLabel.textContent = this.fileInput.files[0].name;
            } else {
                this.fileLabel.textContent = "No file chosen";
            }
        };

        // File label and button
        this.fileLabel = document.createElement("span");
        this.fileLabel.textContent = "No file chosen";
        const fileBtn = document.createElement("button");
        fileBtn.textContent = "Choose File";
        fileBtn.className = "chatbot-send-btn";
        fileBtn.onclick = () => this.fileInput.click();

        // Send button
        this.sendButton = document.createElement("button");
        this.sendButton.textContent = "Send";
        this.sendButton.className = "chatbot-send-btn";

        inputArea.appendChild(this.inputBox);
        inputArea.appendChild(this.optionDropdown);
        inputArea.appendChild(fileBtn);
        inputArea.appendChild(this.fileLabel);
        inputArea.appendChild(this.sendButton);
        inputArea.appendChild(this.fileInput);
        this.chatContainer.appendChild(inputArea);

        this.target.appendChild(this.chatContainer);

        // Event listeners (async handleSend)
        this.sendButton.onclick = () => this.handleSend();
        this.inputBox.onkeydown = (e) => {
            if (e.key === "Enter") this.handleSend();
        };
    }

    private async handleSend() {
        const userText = this.inputBox.value.trim();
        const selectedOption = this.optionDropdown.value;
        const fileName = this.fileInput.files && this.fileInput.files.length > 0
            ? this.fileInput.files[0].name
            : null;
        if (!userText && selectedOption !== "File") return;

        // Display user message
        const userMsg = document.createElement("div");
        userMsg.className = "chatbot-message user";
        userMsg.textContent = `${selectedOption}: ${userText}${fileName ? " | File: " + fileName : ""}`;
        this.messagesArea.appendChild(userMsg);

        // Show loading message
        const botMsg = document.createElement("div");
        botMsg.className = "chatbot-message bot";
        botMsg.textContent = "Thinking...";
        this.messagesArea.appendChild(botMsg);

        // Prepare dataset info (example: column names)
        let datasetInfo = "";
        if (selectedOption === "Dataset" && this.latestDataViews?.length > 0) {
            const columns = this.latestDataViews[0]?.table?.columns.map(col => col.displayName).join(", ");
            datasetInfo = `Columns: ${columns}`;
        }

        // Call LLM API (replace with your endpoint)
        try {const response = await fetch("https://your-llm-api-endpoint", {
            
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Add authorization headers if needed
                },
                body: JSON.stringify({
                    prompt: userText,
                    option: selectedOption,
                    dataset: datasetInfo,
                    fileName: fileName
                })
            });
            const result = await response.json();
            // Example: result = { type: "bar_chart", data: [{ label: "A", value: 10 }, ...] }
        if (result.type === "bar_chart") {
            botMsg.innerHTML = this.renderBarChart(result.data);
        } else if (result.type === "column_chart") {
            botMsg.innerHTML = this.renderColumnChart(result.data);
        } else if (result.type === "pie_chart") {
            botMsg.innerHTML = this.renderPieChart(result.data);
        } else if (result.type === "scatter_chart") {
            botMsg.innerHTML = this.renderScatterChart(result.data);
        } else {
            // Default: show answer as text
            botMsg.innerHTML = `<b>LLM Response:</b> ${result.answer}`;
        }    
        } catch (err) {
            botMsg.innerHTML = `<b>Error:</b> Unable to get response from LLM.`;
        }

        this.inputBox.value = "";
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
// Example chart renderers (simple HTML/CSS, for demo purposes)
private renderBarChart(data: { label: string, value: number }[]): string {
    let html = `<div class="bar-chart">`;
    data.forEach(bar => {
        html += `<div class="bar-row">
            <span class="bar-label">${bar.label}</span>
            <div class="bar" style="width:${bar.value * 5}px">${bar.value}</div>
        </div>`;
    });
    html += `</div>`;
    return html;
}

private renderColumnChart(data: { label: string, value: number }[]): string {
    let html = `<div class="column-chart" style="display:flex;align-items:flex-end;height:120px;">`;
    data.forEach(col => {
        html += `<div style="margin:0 8px;text-align:center;">
            <div style="background:#26a69a;width:32px;height:${col.value * 3}px;border-radius:8px 8px 0 0;"></div>
            <div>${col.label}</div>
            <div>${col.value}</div>
        </div>`;
    });
    html += `</div>`;
    return html;
}
private renderPieChart(data: { label: string, value: number }[]): string {
    // For demo: show as a list (real pie chart needs SVG/canvas)
    let total = data.reduce((sum, d) => sum + d.value, 0);
    let html = `<div class="pie-chart"><b>Pie Chart</b><ul>`;
    data.forEach(slice => {
        let percent = ((slice.value / total) * 100).toFixed(1);
        html += `<li>${slice.label}: ${slice.value} (${percent}%)</li>`;
    });
    html += `</ul></div>`;
    return html;
}

private renderScatterChart(data: { x: number, y: number, label?: string }[]): string {
    // For demo: show as a table (real scatter needs SVG/canvas)
    let html = `<div class="scatter-chart"><b>Scatter Chart</b><table><tr><th>X</th><th>Y</th><th>Label</th></tr>`;
    data.forEach(point => {
        html += `<tr><td>${point.x}</td><td>${point.y}</td><td>${point.label || ""}</td></tr>`;
    });
    html += `</table></div>`;
    return html;
}
    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews[0]
        );
        this.latestDataViews = options.dataViews;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
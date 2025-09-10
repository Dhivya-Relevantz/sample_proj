import * as React from "react"; 

import { useState, useEffect, useRef } from "react"; 

import Chart from "chart.js/auto"; 

 

// Helper to get values for a field (from categories or values) 

function getValuesForField(dataView: any, fieldDisplayName: string): any[] { 

    // Try categories 

    const cat = dataView.categorical.categories?.find( 

        (c: any) => c.source.displayName === fieldDisplayName 

    ); 

    if (cat) return cat.values; 

 

    // Try values (measures) 

    const val = dataView.categorical.values?.find( 

        (v: any) => v.source.displayName === fieldDisplayName 

    ); 

    if (val) return val.values; 

 

    return []; 

} 

 

type Message = { 

    sender: string; 

    text: string; 

}; 

 

type ChatbotProps = { 

    dataView: any; 

}; 

 
const  GEMINI_API_KEY="AIzaSyA4A-uA74Kh6WIUlLi-7AByTZpCguG8tdM";
const Chatbot: React.FC<ChatbotProps> = (props) => { 

    const [messages, setMessages] = useState<Message[]>([]); 

    const [input, setInput] = useState(""); 

    const [loading, setLoading] = useState(false); 

    const [chartInfo, setChartInfo] = useState<{ 

        type?: string; 

        labels?: any[]; 

        data?: any[]; 

    } | null>(null); 

 

    const chartRef = useRef<HTMLCanvasElement>(null); 

 

    // Defensive: Require field mapping before using data 

    if ( 

        !props.dataView || 

        !props.dataView.categorical || 

        !props.dataView.categorical.categories.length || 

        !props.dataView.categorical.values.length 

    ) { 

        return <div style={{ padding: 15, color: 'crimson' }}>Please map the required fields in Power BI.</div>; 

    } 

 

    // Get all available field names for schema 

    const categories = props.dataView.categorical.categories.map((c: any) => c.source.displayName); 

    const values = props.dataView.categorical.values.map((v: any) => v.source.displayName); 

 

    // Handle sending user prompt and getting DAX/chart from LLM 

    const handleSend = async () => { 

        if (!input.trim()) return; 

        setMessages(msgs => [...msgs, { sender: "user", text: input }]); 

        setInput(""); 

        setLoading(true); 

 

        const llmPayload = { 

            prompt: input, 

            schema: { 

                categories: categories, 

                measures: values 

            } 

        }; 

 

        try { 

            // --- Call your LLM endpoint here! --- 

          const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: input }]
        }
      ]
    })
  }
);


            const result = await response.json(); 

 

            // --- Handle chart or DAX reply --- 

            if (result.action === "chart" && result.chartType && result.chartFields) { 

                const categoryField = result.chartFields.category; 

                const valueField = result.chartFields.value; 

                const categoriesArr = getValuesForField(props.dataView, categoryField); 

                const valuesArr = getValuesForField(props.dataView, valueField); 

 

                setChartInfo({ 

                    type: result.chartType, // e.g., "bar", "pie" 

                    labels: categoriesArr, 

                    data: valuesArr 

                }); 

 

                setMessages(msgs => [ 

                    ...msgs, 

                    { sender: "bot", text: result.explanation || `Showing a ${result.chartType} chart.` } 

                ]); 

            } else if (result.action === "dax" && result.dax) { 

                setChartInfo(null); 

                setMessages(msgs => [ 

                    ...msgs, 

                    { sender: "bot", text: `Here is your DAX code:\n\n\`\`\`\n${result.dax}\n\`\`\`\n${result.explanation || ""}` } 

                ]); 

            } else { 

                setChartInfo(null); 

                setMessages(msgs => [ 

                    ...msgs, 

                    { sender: "bot", text: result.text || "AI replied!" } 

                ]); 

            } 

 

        } catch (error) { 

            setChartInfo(null); 

            setMessages(msgs => [...msgs, { sender: "bot", text: "Sorry, error contacting AI." }]); 

        } 

        setLoading(false); 

    }; 

 

    // Render/destroy Chart.js chart when chartInfo changes 

    useEffect(() => { 

        let chartInstance: any = null; 

        if (chartInfo && chartRef.current) { 

            chartInstance = new Chart(chartRef.current, { 

                type: chartInfo.type as any, 

                data: { 

                    labels: chartInfo.labels, 

                    datasets: [{ 

                        label: chartInfo.type, 

                        data: chartInfo.data, 

                        backgroundColor: "#268aff" 

                    }] 

                } 

            }); 

        } 

        return () => { 

            if (chartInstance) chartInstance.destroy(); 

        }; 

    }, [chartInfo]); 

 

    return ( 

        <div style={{ width: "100%", maxWidth: 520, fontFamily: "sans-serif" }}> 

            <div style={{ height: 180, overflowY: "auto", border: "1px solid #bbb", borderRadius: 4, marginBottom: 10, padding: 10, background: "#fafcff" }}> 

                {messages.map((m, idx) => { 

                    // Detect code block and render monospace 

                    const codeMatch = m.text.match(/``````/); 

                    return ( 

                        <div key={idx} style={{ whiteSpace: 'pre-line', textAlign: m.sender === "user" ? 'right' : 'left', margin: "4px 0" }}> 

                            <b>{m.sender === "user" ? "You" : "AI"}:</b> 

                            {codeMatch ? ( 

                                <div style={{ background: "#f4f4f4", padding: "7px 12px", color: "#404040", borderRadius: 4, fontFamily: "monospace", margin: "5px 0" }}> 

                                    {codeMatch[1]} 

                                </div> 

                            ) : ( 

                                <span> {m.text}</span> 

                            )} 

                        </div> 

                    ) 

                })} 

                {loading && <div style={{ color: "#006cff" }}>AI is typing…</div>} 

            </div> 

            {chartInfo && 

                <div style={{ padding: 8, background: "#f5faff", borderRadius: 4 }}> 

                    <canvas ref={chartRef} width={420} height={220} /> 

                </div> 

            } 

            <div style={{ marginTop: 10 }}> 

                <input 

                    style={{ width: "70%", padding: 7, marginRight: 5 }} 

                    value={input} 

                    onChange={e => setInput(e.target.value)} 

                    placeholder="Ask for DAX or chart…" 

                    onKeyDown={e => { if (e.key === "Enter") handleSend(); }} 

                    disabled={loading} 

                /> 

                <button onClick={handleSend} style={{ padding: "7px 16px" }} disabled={loading || !input.trim()}>Send</button> 

            </div> 

        </div> 

    ); 

}; 

 

export default Chatbot; 
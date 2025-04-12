import React, { useState, useEffect, useRef } from 'react';

const GRPOAdvantageVisualization = () => {
  const [numCompletions, setNumCompletions] = useState(3);
  const [rewards, setRewards] = useState([0, 0, 0]);
  const [advantages, setAdvantages] = useState([0, 0, 0]);
  const svgRef = useRef(null);

  // Configuration
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 400;
  const MARGIN = { top: 40, right: 40, bottom: 80, left: 60 };
  const INNER_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  // Calculate standardized advantages
  const calculateAdvantages = (rewardValues) => {
    const mean = rewardValues.reduce((sum, r) => sum + r, 0) / rewardValues.length;
    const variance = rewardValues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rewardValues.length;
    const std = Math.sqrt(variance);
    
    if (std === 0) return rewardValues.map(() => 0);
    
    return rewardValues.map(r => (r - mean) / std);
  };

  // Update advantages when rewards or number of completions change
  useEffect(() => {
    const newAdvantages = calculateAdvantages(rewards.slice(0, numCompletions));
    setAdvantages(newAdvantages);
  }, [rewards, numCompletions]);

  // Adjust rewards array when number of completions changes
  useEffect(() => {
    const newRewards = [...rewards];
    if (numCompletions > rewards.length) {
      // Add new rewards initialized to 0
      for (let i = rewards.length; i < numCompletions; i++) {
        newRewards.push(0);
      }
    }
    setRewards(newRewards);
  }, [numCompletions]);

  // Initialize SVG chart once
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    svg.innerHTML = ''; // Clear existing content
    
    // Create main group
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.setAttribute('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    svg.appendChild(mainGroup);
    
    // Create grid lines
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');
    mainGroup.appendChild(gridGroup);
    
    // Y-axis grid lines
    for (let i = -2; i <= 2; i += 0.5) {
      const y = INNER_HEIGHT / 2 - (i * INNER_HEIGHT / 4);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', INNER_WIDTH);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e0e0e0');
      line.setAttribute('stroke-width', i === 0 ? '2' : '1');
      gridGroup.appendChild(line);
    }
    
    // Axes
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axesGroup.setAttribute('class', 'axes');
    mainGroup.appendChild(axesGroup);
    
    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', INNER_HEIGHT / 2);
    xAxis.setAttribute('x2', INNER_WIDTH);
    xAxis.setAttribute('y2', INNER_HEIGHT / 2);
    xAxis.setAttribute('stroke', '#333');
    xAxis.setAttribute('stroke-width', '2');
    axesGroup.appendChild(xAxis);
    
    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', INNER_HEIGHT);
    yAxis.setAttribute('stroke', '#333');
    yAxis.setAttribute('stroke-width', '2');
    axesGroup.appendChild(yAxis);
    
    // Y-axis labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'labels');
    mainGroup.appendChild(labelsGroup);
    
    for (let i = -2; i <= 2; i += 0.5) {
      const y = INNER_HEIGHT / 2 - (i * INNER_HEIGHT / 4);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', -10);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#666');
      text.textContent = i.toString();
      labelsGroup.appendChild(text);
    }
    
    // Y-axis title
    const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yTitle.setAttribute('x', -40);
    yTitle.setAttribute('y', INNER_HEIGHT / 2);
    yTitle.setAttribute('text-anchor', 'middle');
    yTitle.setAttribute('font-size', '14');
    yTitle.setAttribute('font-weight', 'bold');
    yTitle.setAttribute('fill', '#333');
    yTitle.setAttribute('transform', `rotate(-90, -40, ${INNER_HEIGHT / 2})`);
    yTitle.textContent = 'Advantage';
    labelsGroup.appendChild(yTitle);
    
    // X-axis title
    const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xTitle.setAttribute('x', INNER_WIDTH / 2);
    xTitle.setAttribute('y', INNER_HEIGHT + 45);
    xTitle.setAttribute('text-anchor', 'middle');
    xTitle.setAttribute('font-size', '14');
    xTitle.setAttribute('font-weight', 'bold');
    xTitle.setAttribute('fill', '#333');
    xTitle.textContent = 'Completion Index';
    labelsGroup.appendChild(xTitle);
    
    // Bars group (will be updated dynamically)
    const barsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    barsGroup.setAttribute('class', 'bars');
    mainGroup.appendChild(barsGroup);
    
  }, []);

  // Update bars when advantages change
  useEffect(() => {
    if (!svgRef.current) return;
    
    const barsGroup = svgRef.current.querySelector('.bars');
    if (!barsGroup) return;
    
    barsGroup.innerHTML = ''; // Clear existing bars
    
    const barWidth = INNER_WIDTH / (numCompletions + 1);
    
    advantages.slice(0, numCompletions).forEach((advantage, i) => {
      const x = (i + 1) * barWidth - barWidth / 3;
      const barHeight = Math.abs(advantage) * (INNER_HEIGHT / 4);
      const y = advantage >= 0 ? 
        INNER_HEIGHT / 2 - barHeight : 
        INNER_HEIGHT / 2;
      
      // Bar
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth / 1.5);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', advantage >= 0 ? '#4CAF50' : '#f44336');
      rect.setAttribute('stroke', '#333');
      rect.setAttribute('stroke-width', '1');
      barsGroup.appendChild(rect);
      
      // Advantage value label
      const advantageLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      advantageLabel.setAttribute('x', x + barWidth / 3);
      const advantageY = advantage >= 0 ? y - 5 : y + barHeight + 15;
      advantageLabel.setAttribute('y', advantageY);
      advantageLabel.setAttribute('text-anchor', 'middle');
      advantageLabel.setAttribute('font-size', '12');
      advantageLabel.setAttribute('font-weight', 'bold');
      advantageLabel.setAttribute('fill', '#333');
      advantageLabel.textContent = advantage.toFixed(2);
      barsGroup.appendChild(advantageLabel);

      // X-axis label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 3);
      text.setAttribute('y', INNER_HEIGHT + 20);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#666');
      text.textContent = `${i + 1}`;
      barsGroup.appendChild(text);
    });
  }, [advantages, numCompletions]);

  const handleRewardChange = (index, value) => {
    const newRewards = [...rewards];
    newRewards[index] = parseFloat(value) || 0;
    setRewards(newRewards);
  };

  const handleNumCompletionsChange = (value) => {
    setNumCompletions(parseInt(value));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white">
      <h1 className="text-3xl font-bold mb-6 text-center">GRPO Advantage</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-2xl font-mono mb-4">
          A<sub>i</sub> = (r<sub>i</sub> - &mu;) / &sigma;
        </p>
        <div className="text-sm text-gray-600">
          <p><span className="font-mono">A<sub>i</sub></span>: Advantage for completion i</p>
          <p><span className="font-mono">r<sub>i</sub></span>: Reward for completion i</p>
          <p><span className="font-mono">&mu;</span>: Mean of rewards</p>
          <p><span className="font-mono">&sigma;</span>: Standard deviation of rewards</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Configuration</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Number of Completions:</label>
          <select 
            value={numCompletions} 
            onChange={(e) => handleNumCompletionsChange(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
      </div>

      {/* Visual Feedback - Bar Graph */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-center">
          <svg 
            ref={svgRef}
            width={CHART_WIDTH} 
            height={CHART_HEIGHT}
            className="border border-gray-300 bg-white rounded"
          />
        </div>
      </div>

      {/* Statistics Display */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">
            Mean: {(rewards.slice(0, numCompletions).reduce((sum, r) => sum + r, 0) / numCompletions).toFixed(4)} | 
            Std: {Math.sqrt(rewards.slice(0, numCompletions).reduce((sum, r, _, arr) => {
              const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
              return sum + Math.pow(r - mean, 2);
            }, 0) / numCompletions).toFixed(4)}
          </div>
        </div>
      </div>

      {/* Reward Controls */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">Group Reward Controls</h2>
        <div className="flex justify-center space-x-8">
          {Array.from({ length: numCompletions }, (_, i) => (
            <div key={i} className="flex flex-col items-center">
              <label className="text-sm font-medium mb-2">Completion {i + 1}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={rewards[i] || 0}
                onChange={(e) => handleRewardChange(i, e.target.value)}
                className="w-4 h-32 slider-vertical"
                style={{ 
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical',
                  width: '20px',
                  height: '120px'
                }}
              />
              <input
                type="number"
                min="-10"
                max="10"
                step="0.1"
                value={rewards[i] || 0}
                onChange={(e) => handleRewardChange(i, e.target.value)}
                className="w-16 mt-2 px-2 py-1 border rounded text-center text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GRPOAdvantageVisualization;
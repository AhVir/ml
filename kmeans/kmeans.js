// K-Means Clustering Algorithm Implementation
// Author: AhVir
// Last Updated: November 17, 2025

class KMeans {
    constructor() {
        this.dataPoints = [];
        this.centroids = [];
        this.assignments = [];
        this.k = 3;
        this.iteration = 0;
        this.isRunning = false;
        this.hasConverged = false;
        this.animationSpeed = 500;
        this.colors = [
            '#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6',
            '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'
        ];
        this.seed = 42;

        this.initializeElements();
        this.attachEventListeners();
        this.initializePlot();
    }

    initializeElements() {
        // Control elements
        this.numPointsSlider = document.getElementById('numPoints');
        this.numClustersSlider = document.getElementById('numClusters');
        this.randomSeedInput = document.getElementById('randomSeed');
        this.initMethodSelect = document.getElementById('initMethod');
        this.addPointModeCheckbox = document.getElementById('addPointMode');
        this.animSpeedSlider = document.getElementById('animSpeed');

        // Buttons
        this.generateDataBtn = document.getElementById('generateData');
        this.addManualPointsBtn = document.getElementById('addManualPoints');
        this.manualInputTextarea = document.getElementById('manualInput');
        this.startBtn = document.getElementById('startBtn');
        this.stepBtn = document.getElementById('stepBtn');
        this.runToEndBtn = document.getElementById('runToEndBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Display elements
        this.pointsValueSpan = document.getElementById('pointsValue');
        this.kValueSpan = document.getElementById('kValue');
        this.speedValueSpan = document.getElementById('speedValue');
        this.iterationCountSpan = document.getElementById('iterationCount');
        this.totalPointsSpan = document.getElementById('totalPoints');
        this.currentKSpan = document.getElementById('currentK');
        this.algorithmStatusSpan = document.getElementById('algorithmStatus');
        this.centroidInfoDiv = document.getElementById('centroidInfo');
        this.assignmentBody = document.getElementById('assignmentBody');
        this.iterationLogDiv = document.getElementById('iterationLog');
    }

    attachEventListeners() {
        // Slider updates
        this.numPointsSlider.addEventListener('input',(e) => {
            this.pointsValueSpan.textContent = e.target.value;
        });

        this.numClustersSlider.addEventListener('input',(e) => {
            this.kValueSpan.textContent = e.target.value;
            this.k = parseInt(e.target.value);
        });

        this.animSpeedSlider.addEventListener('input',(e) => {
            this.animationSpeed = parseInt(e.target.value);
            this.speedValueSpan.textContent = `${e.target.value}ms`;
        });

        // Button clicks
        this.generateDataBtn.addEventListener('click',() => this.generateRandomData());
        this.addManualPointsBtn.addEventListener('click',() => this.addManualPoints());
        this.startBtn.addEventListener('click',() => this.startAlgorithm());
        this.stepBtn.addEventListener('click',() => this.stepIteration());
        this.runToEndBtn.addEventListener('click',() => this.runToConvergence());
        this.resetBtn.addEventListener('click',() => this.reset());
    }

    // Seeded random number generator for reproducibility
    seededRandom() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    generateRandomData() {
        this.seed = parseInt(this.randomSeedInput.value);
        const numPoints = parseInt(this.numPointsSlider.value);
        this.k = parseInt(this.numClustersSlider.value);

        this.dataPoints = [];

        // Generate clusters with some separation
        const numClusters = Math.min(5,this.k);
        const pointsPerCluster = Math.floor(numPoints / numClusters);

        for(let i = 0; i < numClusters; i++) {
            const centerX = (this.seededRandom() - 0.5) * 20;
            const centerY = (this.seededRandom() - 0.5) * 20;

            for(let j = 0; j < pointsPerCluster; j++) {
                const angle = this.seededRandom() * 2 * Math.PI;
                const radius = this.seededRandom() * 3;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                this.dataPoints.push({x,y});
            }
        }

        // Add remaining points randomly
        const remaining = numPoints - (pointsPerCluster * numClusters);
        for(let i = 0; i < remaining; i++) {
            this.dataPoints.push({
                x: (this.seededRandom() - 0.5) * 20,
                y: (this.seededRandom() - 0.5) * 20
            });
        }

        this.updateStatusDisplay();
        this.plotData();
        this.logMessage('Generated random dataset with ' + numPoints + ' points','info');
    }

    addCustomPoint(x,y) {
        this.dataPoints.push({x,y});
        this.updateStatusDisplay();
        this.plotData();
        this.logMessage(`Added custom point at (${x.toFixed(2)}, ${y.toFixed(2)})`,'info');
    }

    addManualPoints() {
        const input = this.manualInputTextarea.value.trim();
        if(!input) {
            alert('Please enter at least one point in (x, y) format');
            return;
        }

        const lines = input.split('\n');
        let addedCount = 0;
        let errorCount = 0;

        for(const line of lines) {
            const trimmedLine = line.trim();
            if(!trimmedLine) continue;

            // Parse (x, y) format
            const match = trimmedLine.match(/\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?/);
            if(match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);

                if(!isNaN(x) && !isNaN(y)) {
                    this.dataPoints.push({x,y});
                    addedCount++;
                } else {
                    errorCount++;
                }
            } else {
                errorCount++;
            }
        }

        if(addedCount > 0) {
            this.updateStatusDisplay();
            this.plotData();
            this.logMessage(`Added ${addedCount} manual point(s)`,'success');
            this.manualInputTextarea.value = ''; // Clear input
        }

        if(errorCount > 0) {
            alert(`Successfully added ${addedCount} points. ${errorCount} line(s) had invalid format.`);
        }
    }

    initializePlot() {
        const layout = {
            title: 'K-Means Clustering Visualization',
            xaxis: {title: 'X',range: [-12,12]},
            yaxis: {title: 'Y',range: [-12,12]},
            hovermode: 'closest',
            showlegend: true,
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: 'white'
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        };

        Plotly.newPlot('plotDiv',[],layout,config);

        // Attach click event for adding custom points
        const plotDiv = document.getElementById('plotDiv');
        plotDiv.on('plotly_click',(data) => {
            if(this.addPointModeCheckbox.checked && !this.isRunning) {
                const point = data.points[0];
                this.addCustomPoint(point.x,point.y);
            }
        });
    }

    plotData() {
        const traces = [];

        if(this.dataPoints.length === 0) {
            Plotly.newPlot('plotDiv',traces,{
                title: 'K-Means Clustering Visualization',
                xaxis: {title: 'X',range: [-12,12]},
                yaxis: {title: 'Y',range: [-12,12]}
            });
            return;
        }

        // Group points by cluster assignment
        if(this.assignments.length > 0) {
            for(let k = 0; k < this.k; k++) {
                const clusterPoints = this.dataPoints.filter((_,i) => this.assignments[i] === k);
                if(clusterPoints.length > 0) {
                    traces.push({
                        x: clusterPoints.map(p => p.x),
                        y: clusterPoints.map(p => p.y),
                        mode: 'markers',
                        type: 'scatter',
                        name: `Cluster ${k + 1}`,
                        marker: {
                            size: 8,
                            color: this.colors[k],
                            opacity: 0.7
                        }
                    });
                }
            }
        } else {
            // Unassigned points
            traces.push({
                x: this.dataPoints.map(p => p.x),
                y: this.dataPoints.map(p => p.y),
                mode: 'markers',
                type: 'scatter',
                name: 'Data Points',
                marker: {
                    size: 8,
                    color: '#6b7280',
                    opacity: 0.7
                }
            });
        }

        // Plot centroids
        if(this.centroids.length > 0) {
            traces.push({
                x: this.centroids.map(c => c.x),
                y: this.centroids.map(c => c.y),
                mode: 'markers',
                type: 'scatter',
                name: 'Centroids',
                marker: {
                    size: 16,
                    symbol: 'star',
                    color: this.centroids.map((_,i) => this.colors[i]),
                    line: {width: 2,color: 'black'}
                }
            });
        }

        const layout = {
            title: `K-Means Clustering (Iteration ${this.iteration})`,
            xaxis: {title: 'X',range: [-12,12]},
            yaxis: {title: 'Y',range: [-12,12]},
            hovermode: 'closest',
            showlegend: true,
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: 'white'
        };

        Plotly.react('plotDiv',traces,layout);
    }

    startAlgorithm() {
        if(this.dataPoints.length === 0) {
            alert('Please generate or add data points first!');
            return;
        }

        if(this.dataPoints.length < this.k) {
            alert('Number of points must be greater than or equal to K!');
            return;
        }

        this.isRunning = true;
        this.iteration = 0;
        this.hasConverged = false;
        this.assignments = new Array(this.dataPoints.length).fill(-1);

        // Initialize centroids
        this.initializeCentroids();

        this.updateButtonStates();
        this.updateStatusDisplay();
        this.logMessage('Algorithm started - Centroids initialized','success');
        this.plotData();
    }

    initializeCentroids() {
        this.centroids = [];
        const initMethod = this.initMethodSelect.value;

        if(initMethod === 'random') {
            // Random initialization
            const indices = [];
            while(indices.length < this.k) {
                const idx = Math.floor(this.seededRandom() * this.dataPoints.length);
                if(!indices.includes(idx)) {
                    indices.push(idx);
                    this.centroids.push({...this.dataPoints[idx]});
                }
            }
        } else {
            // K-means++ initialization
            // First centroid is random
            const firstIdx = Math.floor(this.seededRandom() * this.dataPoints.length);
            this.centroids.push({...this.dataPoints[firstIdx]});

            // Select remaining centroids
            for(let i = 1; i < this.k; i++) {
                const distances = this.dataPoints.map(point => {
                    let minDist = Infinity;
                    for(const centroid of this.centroids) {
                        const dist = this.euclideanDistance(point,centroid);
                        minDist = Math.min(minDist,dist);
                    }
                    return minDist * minDist;
                });

                const sumDistances = distances.reduce((a,b) => a + b,0);
                let random = this.seededRandom() * sumDistances;

                for(let j = 0; j < distances.length; j++) {
                    random -= distances[j];
                    if(random <= 0) {
                        this.centroids.push({...this.dataPoints[j]});
                        break;
                    }
                }
            }
        }

        this.updateCentroidDisplay();
    }

    euclideanDistance(p1,p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x,2) + Math.pow(p1.y - p2.y,2));
    }

    assignPointsToClusters() {
        const newAssignments = [];
        const distances = [];

        for(let i = 0; i < this.dataPoints.length; i++) {
            const point = this.dataPoints[i];
            let minDist = Infinity;
            let closestCluster = 0;
            const pointDistances = [];

            for(let k = 0; k < this.k; k++) {
                const dist = this.euclideanDistance(point,this.centroids[k]);
                pointDistances.push(dist);
                if(dist < minDist) {
                    minDist = dist;
                    closestCluster = k;
                }
            }

            newAssignments.push(closestCluster);
            distances.push({point: i,cluster: closestCluster,distance: minDist,allDistances: pointDistances});
        }

        this.assignments = newAssignments;
        this.updateAssignmentTable(distances);
    }

    updateCentroids() {
        const newCentroids = [];
        let centroidsChanged = false;

        for(let k = 0; k < this.k; k++) {
            const clusterPoints = this.dataPoints.filter((_,i) => this.assignments[i] === k);

            if(clusterPoints.length === 0) {
                // Keep old centroid if cluster is empty
                newCentroids.push({...this.centroids[k]});
                continue;
            }

            const sumX = clusterPoints.reduce((sum,p) => sum + p.x,0);
            const sumY = clusterPoints.reduce((sum,p) => sum + p.y,0);
            const newCentroid = {
                x: sumX / clusterPoints.length,
                y: sumY / clusterPoints.length
            };

            // Check if centroid moved
            const movement = this.euclideanDistance(this.centroids[k],newCentroid);
            if(movement > 0.0001) {
                centroidsChanged = true;
            }

            newCentroids.push(newCentroid);
        }

        this.centroids = newCentroids;
        this.hasConverged = !centroidsChanged;

        return centroidsChanged;
    }

    stepIteration() {
        if(!this.isRunning || this.hasConverged) {
            return;
        }

        this.iteration++;

        // Step 1: Assign points to nearest centroids
        this.assignPointsToClusters();
        this.plotData();

        setTimeout(() => {
            // Step 2: Update centroids
            const changed = this.updateCentroids();
            this.updateCentroidDisplay();
            this.plotData();

            if(this.hasConverged) {
                this.logMessage(`Algorithm converged at iteration ${this.iteration}!`,'success');
                this.algorithmStatusSpan.innerHTML = '<span class="convergence-badge">Converged</span>';
                this.updateButtonStates();
            } else {
                this.logMessage(`Iteration ${this.iteration} completed - Centroids updated`,'info');
            }

            this.updateStatusDisplay();
        },this.animationSpeed / 2);
    }

    async runToConvergence() {
        if(!this.isRunning || this.hasConverged) {
            return;
        }

        this.runToEndBtn.disabled = true;
        this.stepBtn.disabled = true;

        while(!this.hasConverged && this.iteration < 100) {
            await new Promise(resolve => {
                this.stepIteration();
                setTimeout(resolve,this.animationSpeed);
            });
        }

        if(this.iteration >= 100) {
            this.logMessage('Maximum iterations (100) reached','warning');
        }
    }

    reset() {
        this.dataPoints = [];
        this.centroids = [];
        this.assignments = [];
        this.iteration = 0;
        this.isRunning = false;
        this.hasConverged = false;

        this.updateButtonStates();
        this.updateStatusDisplay();
        this.plotData();

        this.centroidInfoDiv.innerHTML = '<p class="text-sm text-gray-500">Run the algorithm to see centroids</p>';
        this.assignmentBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 text-sm py-4">No data available</td></tr>';
        this.iterationLogDiv.innerHTML = '<p class="text-sm text-gray-500">Algorithm log will appear here</p>';

        this.logMessage('Algorithm reset','info');
    }

    updateButtonStates() {
        if(this.isRunning && !this.hasConverged) {
            this.startBtn.disabled = true;
            this.startBtn.classList.add('bg-gray-300','text-gray-600');
            this.startBtn.classList.remove('btn-primary');

            this.stepBtn.disabled = false;
            this.stepBtn.classList.remove('bg-gray-300','text-gray-600');
            this.stepBtn.classList.add('btn-primary','text-white');

            this.runToEndBtn.disabled = false;
            this.runToEndBtn.classList.remove('bg-gray-300','text-gray-600');
            this.runToEndBtn.classList.add('bg-green-500','hover:bg-green-600','text-white');
        } else {
            this.startBtn.disabled = false;
            this.startBtn.classList.remove('bg-gray-300','text-gray-600');
            this.startBtn.classList.add('btn-primary');

            this.stepBtn.disabled = true;
            this.stepBtn.classList.add('bg-gray-300','text-gray-600');
            this.stepBtn.classList.remove('btn-primary','text-white');

            this.runToEndBtn.disabled = true;
            this.runToEndBtn.classList.add('bg-gray-300','text-gray-600');
            this.runToEndBtn.classList.remove('bg-green-500','hover:bg-green-600','text-white');
        }
    }

    updateStatusDisplay() {
        this.iterationCountSpan.textContent = this.iteration;
        this.totalPointsSpan.textContent = this.dataPoints.length;
        this.currentKSpan.textContent = this.k;

        if(!this.isRunning) {
            this.algorithmStatusSpan.textContent = 'Not Started';
            this.algorithmStatusSpan.className = 'font-semibold text-gray-800';
        } else if(this.hasConverged) {
            this.algorithmStatusSpan.innerHTML = '<span class="convergence-badge">Converged</span>';
        } else {
            this.algorithmStatusSpan.textContent = 'Running';
            this.algorithmStatusSpan.className = 'font-semibold text-blue-600';
        }
    }

    updateCentroidDisplay() {
        let html = '';
        for(let k = 0; k < this.centroids.length; k++) {
            const centroid = this.centroids[k];
            const clusterSize = this.assignments.filter(a => a === k).length;
            html += `
                <div class="flex items-center justify-between text-sm mb-2">
                    <div class="flex items-center">
                        <span class="cluster-color" style="background-color: ${this.colors[k]}"></span>
                        <span class="font-semibold">Cluster ${k + 1}</span>
                    </div>
                    <span class="text-gray-600 text-xs">${clusterSize} points</span>
                </div>
                <div class="text-xs text-gray-600 ml-6 mb-3">
                    (${centroid.x.toFixed(3)}, ${centroid.y.toFixed(3)})
                </div>
            `;
        }
        this.centroidInfoDiv.innerHTML = html;
    }

    updateAssignmentTable(distances) {
        let html = '';
        const maxRows = 50; // Limit display for performance

        for(let i = 0; i < Math.min(distances.length,maxRows); i++) {
            const d = distances[i];
            const point = this.dataPoints[d.point];
            html += `
                <tr>
                    <td class="text-gray-600">${d.point + 1}</td>
                    <td class="text-gray-600">${point.x.toFixed(2)}</td>
                    <td class="text-gray-600">${point.y.toFixed(2)}</td>
                    <td>
                        <span class="cluster-color" style="background-color: ${this.colors[d.cluster]}"></span>
                        ${d.cluster + 1}
                    </td>
                    <td class="text-gray-600">${d.distance.toFixed(3)}</td>
                </tr>
            `;
        }

        if(distances.length > maxRows) {
            html += `
                <tr>
                    <td colspan="5" class="text-center text-gray-500 text-xs py-2">
                        ... and ${distances.length - maxRows} more points
                    </td>
                </tr>
            `;
        }

        this.assignmentBody.innerHTML = html;
    }

    logMessage(message,type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: 'bg-blue-50 border-blue-300 text-blue-800',
            success: 'bg-green-50 border-green-300 text-green-800',
            warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
            error: 'bg-red-50 border-red-300 text-red-800'
        };

        const logEntry = document.createElement('div');
        logEntry.className = `iteration-step ${colors[type]} border-l-4`;
        logEntry.innerHTML = `
            <div class="text-xs text-gray-500 mb-1">${timestamp}</div>
            <div class="text-sm font-medium">${message}</div>
        `;

        if(this.iterationLogDiv.querySelector('.text-gray-500')) {
            this.iterationLogDiv.innerHTML = '';
        }

        this.iterationLogDiv.insertBefore(logEntry,this.iterationLogDiv.firstChild);

        // Keep only last 20 log entries
        while(this.iterationLogDiv.children.length > 20) {
            this.iterationLogDiv.removeChild(this.iterationLogDiv.lastChild);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded',() => {
    const kmeans = new KMeans();
    console.log('K-Means Visualizer initialized successfully!');
});

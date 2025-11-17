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
        this.view3D = false;
        this.iterationHistory = []; // Store distance data for each iteration
        this.centroidHistory = []; // Store centroid positions for trace visualization

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
        this.toggle3DBtn = document.getElementById('toggle3DBtn');

        // Display elements
        this.pointsValueSpan = document.getElementById('pointsValue');
        this.kValueSpan = document.getElementById('kValue');
        this.speedValueSpan = document.getElementById('speedValue');
        this.iterationCountSpan = document.getElementById('iterationCount');
        this.totalPointsSpan = document.getElementById('totalPoints');
        this.currentKSpan = document.getElementById('currentK');
        this.algorithmStatusSpan = document.getElementById('algorithmStatus');
        this.centroidInfoDiv = document.getElementById('centroidInfo');
        this.assignmentBody = document.getElementById('assignmentBody'); // Optional
        this.iterationLogDiv = document.getElementById('iterationLog'); // Optional
        this.iterationSlider = document.getElementById('iterationSlider');
        this.selectedIterationSpan = document.getElementById('selectedIteration');
        this.distanceTableContainer = document.getElementById('distanceTableContainer');
        this.downloadCSVBtn = document.getElementById('downloadCSV');
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

        // Iteration history slider
        this.iterationSlider.addEventListener('input',(e) => {
            const iterIndex = parseInt(e.target.value);
            this.selectedIterationSpan.textContent = iterIndex;
            this.displayDistanceTable(iterIndex);
        });

        // Download CSV button
        this.downloadCSVBtn.addEventListener('click',() => this.downloadDistanceTableCSV());

        // Collapsible manual input toggle
        const manualInputHeader = document.getElementById('manualInputHeader');
        const manualInputContent = document.getElementById('manualInputContent');
        const chevron = manualInputHeader.querySelector('.chevron');

        manualInputHeader.addEventListener('click',() => {
            manualInputContent.classList.toggle('active');
            chevron.classList.toggle('rotated');
        });

        // Button clicks
        this.generateDataBtn.addEventListener('click',() => this.generateRandomData());
        if(this.addManualPointsBtn) {
            this.addManualPointsBtn.addEventListener('click',() => this.addManualPoints());
        }
        this.startBtn.addEventListener('click',() => this.startAlgorithm());
        this.stepBtn.addEventListener('click',() => this.stepIteration());
        this.runToEndBtn.addEventListener('click',() => this.runToConvergence());
        this.resetBtn.addEventListener('click',() => this.reset());
        this.toggle3DBtn.addEventListener('click',() => this.toggle3DView());
    }

    // Seeded random number generator for reproducibility
    seededRandom() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    generateRandomData() {
        // Auto-increment seed for different random data each time
        const currentSeed = parseInt(this.randomSeedInput.value);
        this.seed = currentSeed;
        this.randomSeedInput.value = currentSeed + 1; // Increment for next generation

        const numPoints = parseInt(this.numPointsSlider.value);
        this.k = parseInt(this.numClustersSlider.value);

        this.dataPoints = [];

        // Generate clusters with some separation
        const numClusters = Math.min(5,this.k);
        const pointsPerCluster = Math.floor(numPoints / numClusters);

        for(let i = 0; i < numClusters; i++) {
            const centerX = (this.seededRandom() - 0.5) * 16;
            const centerY = (this.seededRandom() - 0.5) * 16;

            for(let j = 0; j < pointsPerCluster; j++) {
                const angle = this.seededRandom() * 2 * Math.PI;
                const radius = this.seededRandom() * 1.5;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                this.dataPoints.push({x,y});
            }
        }

        // Add remaining points randomly
        const remaining = numPoints - (pointsPerCluster * numClusters);
        for(let i = 0; i < remaining; i++) {
            this.dataPoints.push({
                x: (this.seededRandom() - 0.5) * 16,
                y: (this.seededRandom() - 0.5) * 16
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
            title: {
                text: 'K-Means Clustering Visualization - Click "Generate Random Dataset" to start',
                font: {size: 18,family: 'Inter, sans-serif',color: '#1f2937'}
            },
            xaxis: {
                title: {text: 'X Coordinate',font: {size: 14}},
                range: [-12,12],
                gridcolor: '#e5e7eb',
                zerolinecolor: '#9ca3af'
            },
            yaxis: {
                title: {text: 'Y Coordinate',font: {size: 14}},
                range: [-12,12],
                gridcolor: '#e5e7eb',
                zerolinecolor: '#9ca3af'
            },
            hovermode: 'closest',
            showlegend: true,
            plot_bgcolor: '#fafafa',
            paper_bgcolor: 'white',
            margin: {l: 60,r: 150,t: 80,b: 60}
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d','select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'kmeans_clustering',
                height: 700,
                width: 1000,
                scale: 2
            }
        };

        Plotly.newPlot('plotDiv',[],layout,config).then(() => {
            this.attachClickHandler();
        });
    }

    attachClickHandler() {
        // Remove old listeners first to prevent memory leak
        const plotDiv = document.getElementById('plotDiv');
        plotDiv.removeAllListeners('plotly_click');

        // Attach click event for adding custom points
        plotDiv.on('plotly_click',(data) => {
            if(this.addPointModeCheckbox.checked && !this.isRunning && !this.view3D) {
                const point = data.points[0];
                this.addCustomPoint(point.x,point.y);
            }
        });
    }

    toggle3DView() {
        this.view3D = !this.view3D;
        this.toggle3DBtn.textContent = this.view3D ? 'Switch to 2D' : 'Switch to 3D';
        this.plotData();
    }

    plotData() {
        if(this.view3D) {
            this.plot3DData();
        } else {
            this.plot2DData();
        }
    }

    plot2DData() {
        const traces = [];

        if(this.dataPoints.length === 0) {
            Plotly.newPlot('plotDiv',traces,{
                title: {
                    text: 'K-Means Clustering Visualization',
                    font: {size: 20,family: 'Inter, sans-serif'}
                },
                xaxis: {title: 'X',range: [-12,12],gridcolor: '#e5e7eb'},
                yaxis: {title: 'Y',range: [-12,12],gridcolor: '#e5e7eb'},
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white'
            }).then(() => this.attachClickHandler());
            return;
        }

        // Group points by cluster assignment and add cluster circles
        if(this.assignments.length > 0) {
            for(let k = 0; k < this.k; k++) {
                const clusterPoints = this.dataPoints.filter((_,i) => this.assignments[i] === k);
                if(clusterPoints.length > 0) {
                    // Add data points
                    traces.push({
                        x: clusterPoints.map(p => p.x),
                        y: clusterPoints.map(p => p.y),
                        mode: 'markers',
                        type: 'scatter',
                        name: `Cluster ${k + 1}`,
                        marker: {
                            size: 10,
                            color: this.colors[k],
                            opacity: 0.8,
                            line: {
                                color: 'white',
                                width: 1
                            }
                        },
                        hovertemplate: '<b>Cluster %{text}</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>',
                        text: Array(clusterPoints.length).fill(k + 1)
                    });

                    // Add cluster boundary circle
                    if(this.centroids[k]) {
                        const centroid = this.centroids[k];
                        // Calculate max distance from centroid to points in cluster
                        const maxDist = Math.max(...clusterPoints.map(p =>
                            this.euclideanDistance(p,centroid)
                        ));

                        // Create circle shape
                        const theta = Array.from({length: 100},(_,i) => (i / 100) * 2 * Math.PI);
                        const circleX = theta.map(t => centroid.x + maxDist * Math.cos(t));
                        const circleY = theta.map(t => centroid.y + maxDist * Math.sin(t));

                        traces.push({
                            x: circleX,
                            y: circleY,
                            mode: 'lines',
                            type: 'scatter',
                            name: `Cluster ${k + 1} Boundary`,
                            line: {
                                color: this.colors[k],
                                width: 2,
                                dash: 'dash'
                            },
                            opacity: 0.4,
                            showlegend: false,
                            hoverinfo: 'skip'
                        });
                    }
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
                    size: 10,
                    color: '#6b7280',
                    opacity: 0.7,
                    line: {
                        color: 'white',
                        width: 1
                    }
                },
                hovertemplate: '<b>Data Point</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>'
            });
        }

        // Add centroid movement traces (light trails)
        if(this.centroidHistory.length > 1) {
            for(let k = 0; k < this.k; k++) {
                const xPositions = this.centroidHistory.map(hist => hist[k]?.x).filter(x => x !== undefined);
                const yPositions = this.centroidHistory.map(hist => hist[k]?.y).filter(y => y !== undefined);

                if(xPositions.length > 1) {
                    traces.push({
                        x: xPositions,
                        y: yPositions,
                        mode: 'lines+markers',
                        type: 'scatter',
                        name: `C${k + 1} Trail`,
                        line: {
                            color: this.colors[k],
                            width: 1,
                            dash: 'dot'
                        },
                        marker: {
                            size: 4,
                            color: this.colors[k],
                            opacity: 0.3
                        },
                        opacity: 0.4,
                        showlegend: false,
                        hoverinfo: 'skip'
                    });
                }
            }
        }

        // Plot centroids with large circle markers
        if(this.centroids.length > 0) {
            traces.push({
                x: this.centroids.map(c => c.x),
                y: this.centroids.map(c => c.y),
                mode: 'markers',
                type: 'scatter',
                name: 'Centroids',
                marker: {
                    size: 20,
                    symbol: 'circle',
                    color: this.centroids.map((_,i) => this.colors[i]),
                    line: {width: 3,color: 'black'},
                    opacity: 0.9
                },
                hovertemplate: '<b>Centroid %{text}</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>',
                text: this.centroids.map((_,i) => i + 1)
            });
        }

        const layout = {
            title: {
                text: `K-Means Clustering - Iteration ${this.iteration}${this.hasConverged ? ' (Converged)' : ''}`,
                font: {size: 20,family: 'Inter, sans-serif',color: '#1f2937'}
            },
            xaxis: {
                title: {text: 'X Coordinate',font: {size: 14}},
                range: [-12,12],
                gridcolor: '#e5e7eb',
                zerolinecolor: '#9ca3af'
            },
            yaxis: {
                title: {text: 'Y Coordinate',font: {size: 14}},
                range: [-12,12],
                gridcolor: '#e5e7eb',
                zerolinecolor: '#9ca3af'
            },
            hovermode: 'closest',
            showlegend: true,
            legend: {
                x: 1.02,
                y: 1,
                xanchor: 'left',
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: '#e5e7eb',
                borderwidth: 1
            },
            plot_bgcolor: '#fafafa',
            paper_bgcolor: 'white',
            margin: {l: 60,r: 150,t: 80,b: 60}
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d','select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'kmeans_clustering',
                height: 700,
                width: 1000,
                scale: 2
            }
        };

        Plotly.react('plotDiv',traces,layout,config).then(() => {
            // Reattach click event after plot update
            this.attachClickHandler();
        });
    }

    plot3DData() {
        const traces = [];

        if(this.dataPoints.length === 0) {
            const layout = {
                title: {
                    text: 'K-Means Clustering Visualization (3D)',
                    font: {size: 20,family: 'Inter, sans-serif'}
                },
                scene: {
                    xaxis: {title: 'X',range: [-12,12],gridcolor: '#e5e7eb'},
                    yaxis: {title: 'Y',range: [-12,12],gridcolor: '#e5e7eb'},
                    zaxis: {title: 'Cluster Height',range: [0,10],gridcolor: '#e5e7eb'},
                    bgcolor: '#fafafa'
                },
                paper_bgcolor: 'white'
            };
            Plotly.newPlot('plotDiv',traces,layout);
            return;
        }

        // Group points by cluster assignment for 3D visualization
        if(this.assignments.length > 0) {
            for(let k = 0; k < this.k; k++) {
                const clusterPoints = this.dataPoints.filter((_,i) => this.assignments[i] === k);
                if(clusterPoints.length > 0) {
                    // Add data points in 3D - Z coordinate represents cluster height
                    const zValues = clusterPoints.map(() => k * 1.5 + Math.random() * 0.3);

                    traces.push({
                        x: clusterPoints.map(p => p.x),
                        y: clusterPoints.map(p => p.y),
                        z: zValues,
                        mode: 'markers',
                        type: 'scatter3d',
                        name: `Cluster ${k + 1}`,
                        marker: {
                            size: 6,
                            color: this.colors[k],
                            opacity: 0.8,
                            line: {
                                color: 'white',
                                width: 0.5
                            }
                        },
                        hovertemplate: '<b>Cluster %{text}</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<br>Z: %{z:.2f}<extra></extra>',
                        text: Array(clusterPoints.length).fill(k + 1)
                    });

                    // Add centroid in 3D
                    if(this.centroids[k]) {
                        // Add centroid trace in 3D
                        if(this.centroidHistory.length > 1) {
                            const xPositions = this.centroidHistory.map(hist => hist[k]?.x).filter(x => x !== undefined);
                            const yPositions = this.centroidHistory.map(hist => hist[k]?.y).filter(y => y !== undefined);
                            const zPositions = xPositions.map(() => k * 1.5 + 0.15);

                            if(xPositions.length > 1) {
                                traces.push({
                                    x: xPositions,
                                    y: yPositions,
                                    z: zPositions,
                                    mode: 'lines+markers',
                                    type: 'scatter3d',
                                    name: `C${k + 1} Trail`,
                                    line: {
                                        color: this.colors[k],
                                        width: 2,
                                        dash: 'dot'
                                    },
                                    marker: {
                                        size: 3,
                                        color: this.colors[k],
                                        opacity: 0.3
                                    },
                                    opacity: 0.4,
                                    showlegend: false,
                                    hoverinfo: 'skip'
                                });
                            }
                        }

                        traces.push({
                            x: [this.centroids[k].x],
                            y: [this.centroids[k].y],
                            z: [k * 1.5 + 0.15],
                            mode: 'markers',
                            type: 'scatter3d',
                            name: `Centroid ${k + 1}`,
                            marker: {
                                size: 12,
                                color: this.colors[k],
                                symbol: 'diamond',
                                line: {width: 2,color: 'black'},
                                opacity: 1
                            },
                            hovertemplate: '<b>Centroid %{text}</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>',
                            text: [k + 1],
                            showlegend: false
                        });
                    }
                }
            }
        } else {
            // Unassigned points in 3D
            traces.push({
                x: this.dataPoints.map(p => p.x),
                y: this.dataPoints.map(p => p.y),
                z: this.dataPoints.map(() => Math.random() * 0.5),
                mode: 'markers',
                type: 'scatter3d',
                name: 'Data Points',
                marker: {
                    size: 6,
                    color: '#6b7280',
                    opacity: 0.7,
                    line: {
                        color: 'white',
                        width: 0.5
                    }
                },
                hovertemplate: '<b>Data Point</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>'
            });
        }

        const layout = {
            title: {
                text: `K-Means Clustering (3D) - Iteration ${this.iteration}${this.hasConverged ? ' (Converged)' : ''}`,
                font: {size: 20,family: 'Inter, sans-serif',color: '#1f2937'}
            },
            scene: {
                xaxis: {
                    title: {text: 'X Coordinate',font: {size: 12}},
                    range: [-12,12],
                    gridcolor: '#e5e7eb',
                    backgroundcolor: '#fafafa'
                },
                yaxis: {
                    title: {text: 'Y Coordinate',font: {size: 12}},
                    range: [-12,12],
                    gridcolor: '#e5e7eb',
                    backgroundcolor: '#fafafa'
                },
                zaxis: {
                    title: {text: 'Cluster Height',font: {size: 12}},
                    range: [0,Math.max(this.k * 1.5 + 1,5)],
                    gridcolor: '#e5e7eb',
                    backgroundcolor: '#fafafa'
                },
                camera: {
                    eye: {x: 1.5,y: 1.5,z: 1.3}
                }
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: '#e5e7eb',
                borderwidth: 1
            },
            paper_bgcolor: 'white',
            margin: {l: 0,r: 0,t: 60,b: 0}
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'kmeans_clustering_3d',
                height: 700,
                width: 1000,
                scale: 2
            }
        };

        Plotly.react('plotDiv',traces,layout,config);
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

        // Store iteration data for history
        this.iterationHistory.push({
            iteration: this.iteration,
            distances: distances.map(d => ({
                point: d.point,
                cluster: d.cluster,
                distance: d.distance,
                allDistances: [...d.allDistances]
            }))
        });

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

        // Store centroid positions for trace visualization
        this.centroidHistory.push(newCentroids.map(c => ({...c})));

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
            this.updateIterationSlider();
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
        this.iterationHistory = []; // Clear history
        this.centroidHistory = []; // Clear centroid trace

        this.updateButtonStates();
        this.updateStatusDisplay();
        this.plotData();

        this.centroidInfoDiv.innerHTML = '<p class="text-xs text-gray-500">Run the algorithm to see centroids</p>';
        if(this.assignmentBody) {
            this.assignmentBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 text-sm py-4">No data available</td></tr>';
        }
        if(this.iterationLogDiv) {
            this.iterationLogDiv.innerHTML = '<p class="text-sm text-gray-500">Algorithm log will appear here</p>';
        }

        // Reset iteration slider
        this.iterationSlider.disabled = true;
        this.iterationSlider.value = 0;
        this.iterationSlider.max = 0;
        this.selectedIterationSpan.textContent = '-';
        this.downloadCSVBtn.disabled = true;
        this.distanceTableContainer.innerHTML = '<p class="text-gray-500">Run algorithm to see distance tables</p>';

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

        if(this.assignmentBody) {
            this.assignmentBody.innerHTML = html;
        }
    }

    logMessage(message,type = 'info') {
        if(!this.iterationLogDiv) return; // Skip if log div doesn't exist

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

    updateIterationSlider() {
        if(this.iterationHistory.length > 0) {
            this.iterationSlider.disabled = false;
            this.iterationSlider.max = this.iterationHistory.length - 1;
            this.iterationSlider.value = this.iterationHistory.length - 1;
            this.selectedIterationSpan.textContent = this.iterationHistory.length - 1;
            this.downloadCSVBtn.disabled = false;
            this.displayDistanceTable(this.iterationHistory.length - 1);
        }
    }

    displayDistanceTable(iterIndex) {
        if(!this.iterationHistory[iterIndex]) {
            this.distanceTableContainer.innerHTML = '<p class="text-gray-500">No data for this iteration</p>';
            return;
        }

        const iterData = this.iterationHistory[iterIndex];
        const maxRows = 20; // Limit rows for performance

        let html = `
            <div class="text-xs font-bold text-gray-700 mb-2">
                Iteration ${iterData.iteration} - Distance Matrix
            </div>
            <table class="w-full text-xs">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        <th class="p-1 text-left border-b border-gray-300">Pt</th>
        `;

        // Add column headers for each cluster
        for(let k = 0; k < this.k; k++) {
            html += `<th class="p-1 text-center border-b border-gray-300" style="color: ${this.colors[k]}">C${k + 1}</th>`;
        }
        html += `<th class="p-1 text-center border-b border-gray-300">Assigned</th></tr></thead><tbody>`;

        // Add rows for each point (limited)
        for(let i = 0; i < Math.min(iterData.distances.length,maxRows); i++) {
            const d = iterData.distances[i];
            const point = this.dataPoints[d.point];

            // Skip if point doesn't exist (safety check)
            if(!point) continue;

            html += `<tr class="border-b border-gray-200">`;
            html += `<td class="p-1 font-mono">${d.point}</td>`;

            // Show distance to each cluster
            for(let k = 0; k < this.k; k++) {
                const dist = d.allDistances[k];
                const isAssigned = d.cluster === k;
                html += `<td class="p-1 text-center font-mono ${isAssigned ? 'font-bold bg-green-50' : ''}" 
                         style="${isAssigned ? 'color: ' + this.colors[k] : ''}">
                    ${dist.toFixed(2)}
                </td>`;
            }

            html += `<td class="p-1 text-center">
                <span class="px-1 rounded" style="background-color: ${this.colors[d.cluster]}20; color: ${this.colors[d.cluster]}">
                    C${d.cluster + 1}
                </span>
            </td>`;
            html += `</tr>`;
        }

        if(iterData.distances.length > maxRows) {
            html += `
                <tr>
                    <td colspan="${this.k + 2}" class="p-2 text-center text-gray-500">
                        ... and ${iterData.distances.length - maxRows} more points
                    </td>
                </tr>
            `;
        }

        html += `</tbody></table>`;
        this.distanceTableContainer.innerHTML = html;
    }

    downloadDistanceTableCSV() {
        const iterIndex = parseInt(this.iterationSlider.value);
        if(!this.iterationHistory[iterIndex]) {
            alert('No data available for download');
            return;
        }

        const iterData = this.iterationHistory[iterIndex];

        // Create CSV header
        let csv = 'Point,X,Y,';
        for(let k = 0; k < this.k; k++) {
            csv += `Distance_to_C${k + 1},`;
        }
        csv += 'Assigned_Cluster,Assigned_Distance\n';

        // Add data rows
        for(let i = 0; i < iterData.distances.length; i++) {
            const d = iterData.distances[i];
            const point = this.dataPoints[d.point];

            // Skip if point doesn't exist
            if(!point) continue;

            csv += `${d.point},${point.x.toFixed(4)},${point.y.toFixed(4)},`;

            // Add distances to all clusters
            for(let k = 0; k < this.k; k++) {
                csv += `${d.allDistances[k].toFixed(4)},`;
            }

            csv += `C${d.cluster + 1},${d.distance.toFixed(4)}\n`;
        }

        // Create download link
        const blob = new Blob([csv],{type: 'text/csv'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kmeans_iteration_${iterData.iteration}_distances.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded',() => {
    const kmeans = new KMeans();
    console.log('K-Means Visualizer initialized successfully!');
});

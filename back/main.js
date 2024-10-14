let timer;
        let isWorking = true;
        let timeLeft;
        let workTime = 25;
        let breakTime = 5;
        let sessions = JSON.parse(localStorage.getItem('pomodoroSessions')) || [];
        let startTime;
        let audioContext;
        let chart;

        function startTimer() {
            clearInterval(timer);
            isWorking = true;
            workTime = parseInt(document.getElementById('workTime').value);
            breakTime = parseInt(document.getElementById('breakTime').value);
            timeLeft = workTime * 60;
            startTime = new Date();
            updateTimer();
            timer = setInterval(updateTimer, 1000);
            document.getElementById('status').textContent = 'Waktu kerja berjalan';
        }

        function stopTimer() {
            clearInterval(timer);
            document.getElementById('status').textContent = 'Timer dihentikan';
        }

        function updateTimer() {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft === 0) {
                if (isWorking) {
                    isWorking = false;
                    timeLeft = breakTime * 60;
                    document.getElementById('status').textContent = 'Waktu istirahat!';
                    showNotification('Waktu istirahat!');
                    playNotificationSound();
                } else {
                    isWorking = true;
                    timeLeft = workTime * 60;
                    document.getElementById('status').textContent = 'Kembali bekerja!';
                    showNotification('Kembali bekerja!');
                    playNotificationSound();
                }
            } else {
                timeLeft--;
            }
        }

        function showNotification(message) {
            if (Notification.permission === 'granted') {
                new Notification(message);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(message);
                    }
                });
            }
        }

        function playNotificationSound() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        function saveSession() {
            let endTime = new Date();
            let duration = (endTime - startTime) / 1000 / 60; // in minutes
            sessions.push({
                date: endTime.toISOString().split('T')[0],
                duration: duration,
                type: isWorking ? 'work' : 'break'
            });
            localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
            updateChart();
            alert('Sesi berhasil disimpan!');
        }

        function clearData() {
            localStorage.removeItem('pomodoroSessions');
            sessions = [];
            updateChart();
            alert('Data berhasil dihapus!');
        }

        function updateChart() {
            let ctx = document.getElementById('statsChart').getContext('2d');
            let chartData = processDataForChart();

            if (chart) {
                chart.destroy();
            }

            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Waktu Kerja (menit)',
                        data: chartData.workData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    }, {
                        label: 'Waktu Istirahat (menit)',
                        data: chartData.breakData,
                        backgroundColor: 'rgba(255, 206, 86, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        function processDataForChart() {
            let data = {
                labels: [],
                workData: [],
                breakData: []
            };

            let groupedData = {};
            sessions.forEach(session => {
                if (!groupedData[session.date]) {
                    groupedData[session.date] = { work: 0, break: 0 };
                }
                groupedData[session.date][session.type] += session.duration;
            });

            Object.keys(groupedData).sort().forEach(date => {
                data.labels.push(date);
                data.workData.push(groupedData[date].work);
                data.breakData.push(groupedData[date].break);
            });

            return data;
        }

        updateChart();
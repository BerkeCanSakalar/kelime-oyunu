document.addEventListener("DOMContentLoaded", () => {
    const startGameButton = document.getElementById("start-game");
    const loginScreen = document.getElementById("login-screen");
    const gameScreen = document.getElementById("game-screen");
    const hexagonContainer = document.getElementById("hexagon-container");
    const questionText = document.getElementById("question-text");
    const submitAnswerButton = document.getElementById("submit-answer");
    const hintButton = document.getElementById("hint-button");
    const extraTimeButton = document.getElementById("extra-time-button");
    const passButton = document.getElementById("pass-button");
    const clearHexagonsButton = document.getElementById("clear-hexagons");
    const scoreDisplay = document.getElementById("score-display");
    const message = document.getElementById("message");
    const timeLeftDisplay = document.getElementById("time-left");
    const extraTimeDisplay = document.getElementById("extra-time-left");
    const extraTimeDiv = document.getElementById("extra-timer");
    const showScoresButton = document.getElementById("show-scores-btn");
    const scoreSection = document.getElementById("score-section");
    const scoreTableBody = document.querySelector("#score-table tbody");
    const endGameButton = document.getElementById("end-game-button");

    let questions = [];
    let currentQuestion = {};
    let currentAnswerArray = [];
    let revealedIndexes = new Set();
    let score = 0;
    let timeLeft = 180;
    let totalTime = timeLeft;
    let timerId;
    let isExtraTimeActive = false;
    let extraTimerId = null;
    let passCount = 5;
    let hintCount = 0;
    let maxHints = 0;
    let sound = null;
    let hintDelay = false;

   
    function restoreGameState() {
        const savedState = JSON.parse(localStorage.getItem("gameState"));
        const nickname = localStorage.getItem("nickname");
    
        
        
    if (!nickname || !savedState || Object.keys(savedState.currentQuestion || {}).length === 0) {
        localStorage.clear();
        loginScreen.style.display = "block";
        gameScreen.style.display = "none";
        return;
    }
    
        if (savedState) {
            ({ score, timeLeft, passCount, questions, currentQuestion, currentAnswerArray, revealedIndexes, hintCount, maxHints, isExtraTimeActive } = savedState);
            revealedIndexes = new Set(revealedIndexes);
            loginScreen.style.display = "none";
            gameScreen.style.display = "block";
            scoreDisplay.textContent = `Puan: ${score}`;
            document.getElementById("pass-count").textContent = `Pas Hakları: ${passCount}`;
            timeLeftDisplay.textContent = timeLeft;
            questionText.textContent = currentQuestion.question;
            renderHexagons();
    
            
            if (isExtraTimeActive) {
                const savedExtraTimeLeft = savedState.extraTimeLeft || 0;
                extraTimeDisplay.textContent = savedExtraTimeLeft;
                extraTimeDiv.style.display = "block";
                extraTimeButton.style.display = "none";
    
                let extraTimeLeft = savedExtraTimeLeft;
                extraTimerId = setInterval(() => {
                    extraTimeLeft--;
                    extraTimeDisplay.textContent = extraTimeLeft;
    
                    if (extraTimeLeft <= 0) {
                        clearInterval(extraTimerId);
                        isExtraTimeActive = false;
                        extraTimeDiv.style.display = "none";
    
                        
                        showPopupMessage("Ekstra süre doldu! Sıradaki soruya geçiliyor!", "wrong");
                        setTimeout(showNextQuestion, 2000);
                    }
                }, 1000);
            }
    
            startTimer();
        }
    }
    

    
    restoreGameState();

  
    window.addEventListener("beforeunload", saveGameState); 

    async function loadQuestions() {
        const response = await fetch("/questions.json");
        questions = await response.json();
    }

    async function startGame() {
        const nickname = document.getElementById("nickname").value.trim();
        const userID = localStorage.getItem("userID") || `user_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("userID", userID);
    
        if (!nickname) {
            alert("Lütfen bir nickname girin!");
            return;
        }
    
        await loadQuestions();
    
        
        loginScreen.style.display = "none"; 
        gameScreen.style.display = "block"; 
    
        
        score = 0;
        passCount = 5;
        hintCount = 0;
        timeLeft = 180;
    
        
        scoreDisplay.textContent = `Puan: ${score}`;
        document.getElementById("pass-count").textContent = `Pas Hakları: ${passCount}`;
    
        
        startTimer();
        showNextQuestion();
    }
    
    
   
    async function loadScores() {
        try {
            const response = await fetch("/scores");
            const scores = await response.json();

            
            scoreTableBody.innerHTML = "";

            
            scores.forEach((score) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${score.username}</td>
                    <td>${score.score}</td>
                    <td>${score.duration}</td>
                    <td>${new Date(score.date).toLocaleDateString()}</td>
                `;
                scoreTableBody.appendChild(row);
            });
        } catch (err) {
            console.error("Skorlar yüklenemedi:", err);
        }
    }

    
    showScoresButton.addEventListener("click", () => {
        scoreSection.style.display = "block"; 
        loadScores();  
    });

    function startTimer() {
        timerId = setInterval(() => {
            if (!isExtraTimeActive) {
                timeLeft--;
                timeLeftDisplay.textContent = timeLeft;
            }
            if (timeLeft <= 0) {
                clearInterval(timerId);
                message.textContent = "Süre doldu! Yarışma sona eriyor...";
                endGame();
            }

            saveGameState();
        }, 1000);
    }

    function showNextQuestion() {
        passStopSound();
        stopSound(); 
        if (questions.length === 0) {
            message.textContent = "Tüm sorular bitti! Oyun sona erdi.";
            endGame();
            return;
        }
        const randomIndex = Math.floor(Math.random() * questions.length);
        currentQuestion = questions.splice(randomIndex, 1)[0];
        questionText.textContent = currentQuestion.question;
        currentAnswerArray = Array.from(currentQuestion.answer.toLowerCase());
        revealedIndexes.clear();
        hintCount = 0;
        maxHints = Math.floor((currentAnswerArray.length * 2) / 3);
        extraTimeButton.style.display = "block";
        extraTimeDiv.style.display = "none";
        extraTimeDisplay.textContent = "20";
        isExtraTimeActive = false;
        clearInterval(extraTimerId);
        extraTimerId = null;

        // Kelime sayısını kontrol et ve bilgilendirme mesajını güncelle
    const wordInfo = document.getElementById("word-info");
    const wordCount = currentQuestion.answer.split(" ").length; // Kelime sayısını kontrol et
    if (wordCount > 1) {
        wordInfo.textContent = "Bu birden fazla kelimeden oluşuyor.";
    } else {
        wordInfo.textContent = "Bu tek bir kelimedir.";
    }
    
        renderHexagons();

        saveGameState();
    }

    function renderHexagons() {
        hexagonContainer.innerHTML = "";
        currentAnswerArray.forEach((char, index) => {
            const hexagon = document.createElement("div");
            hexagon.className = "hexagon";
            const input = document.createElement("input");
            input.setAttribute("maxlength", "1");
            input.setAttribute("data-index", index);

            // Eğer bu harf "reveal" edilmişse kutuyu doldur ve disabled yap
            if (revealedIndexes.has(index)) {
                input.value = char;
                input.classList.add("reveal");
                input.disabled = true;
            }

            // Harf girildiğinde bir sonraki kutuya geç ve küçük harfe çevir (Türkçe kontrol)
            input.addEventListener("input", () => {
                const typedChar = input.value;
                const lowerCaseChar = typedChar
                    .toLocaleLowerCase("tr") // Türkçe diline göre küçük harf dönüşümü
                    .replace("I", "ı") // Özel durumlar için düzeltme
                    .replace("İ", "i");

                input.value = lowerCaseChar; // Dönüştürülen değeri yazdır
                if (input.value.length === 1) {
                    focusNextInput(index + 1); // Sonraki kutuya geç
                }
            });

            // Geri silme işlemi için önceki kutuya geç
            input.addEventListener("keydown", (event) => {
                if (event.key === "Backspace") {
                    if (input.value === "") {
                        focusPreviousInput(index - 1); // Bir önceki kutuya geç
                    } else {
                        input.value = ""; // Mevcut kutuyu temizle
                    }
                }

                // Enter tuşuna basıldığında cevabı kontrol et
                if (event.key === "Enter") {
                    event.preventDefault(); // Varsayılan davranışı engelle
                    checkAnswer(); // Cevabı kontrol et
                }
            });

            // Odaklanıldığında reveal edilmiş kutuyu atla
            input.addEventListener("focus", () => {
                if (revealedIndexes.has(index)) {
                    focusNextInput(index + 1);
                }
            });

            hexagon.appendChild(input);
            hexagonContainer.appendChild(hexagon);
        });

        // İlk kutuya odaklan
        const firstInput = hexagonContainer.querySelector("input[data-index='0']");
        if (firstInput) firstInput.focus();
    }
    
    
    // Sonraki kutuya odaklan
    function focusNextInput(nextIndex) {
        const inputs = Array.from(hexagonContainer.querySelectorAll("input"));
    
        while (nextIndex >= 0 && nextIndex < inputs.length) {
            if (!inputs[nextIndex].disabled) {
                inputs[nextIndex].focus();
                return;
            }
            nextIndex++; // Bir sonraki kutuya geç
        }
    }
    
    // Önceki kutuya odaklan (Backspace için)
    function focusPreviousInput(prevIndex) {
        const inputs = Array.from(hexagonContainer.querySelectorAll("input"));
    
        while (prevIndex >= 0 && prevIndex < inputs.length) {
            if (!inputs[prevIndex].disabled) {
                inputs[prevIndex].focus();
                return;
            }
            prevIndex--; // Bir önceki kutuya geç
        }
    }

    function pauseTimer() {
        clearInterval(timerId); // Mevcut zamanlayıcıyı durdur
        timerId = null; // Timer durumunu sıfırla
    }
    
    function resumeTimer() {
        if (timerId) return; // Eğer zaten çalışıyorsa yeni bir timer başlatma
        timerId = setInterval(() => {
            if (!isExtraTimeActive) {
                timeLeft--;
                timeLeftDisplay.textContent = timeLeft;
            }
    
            if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;
                message.textContent = "Süre doldu! Yarışma sona eriyor...";
                endGame();
            }
        }, 1000);
    }
    
    

    function showPopupMessage(text, type) {
        const messageElement = document.getElementById("message");
        messageElement.innerHTML = text;
        messageElement.style.display = "block";
    
        if (type === "correct") {
            messageElement.classList.add("message-popup");
            messageElement.classList.remove("wrong-popup", "pass-popup");
        } else if (type === "wrong") {
            messageElement.classList.add("wrong-popup");
            messageElement.classList.remove("message-popup", "pass-popup");
        } else if (type === "pass") {
            messageElement.classList.add("pass-popup");
            messageElement.classList.remove("message-popup", "wrong-popup");
        }
    
        setTimeout(() => {
            messageElement.style.display = "none";
        }, 3000);
    }

    function showPopupWithCountdown(text, type, correctAnswer = null) {
        pauseTimer(); // Süreyi durdur
    
        const messageElement = document.getElementById("countdown-message");
        let countdown = 3;
    
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                messageElement.innerHTML = `
                    ${text}
                    ${correctAnswer ? `<div class="correct-answer">Doğru cevap: ${correctAnswer}</div>` : ""}
                    <span id="countdown">(${countdown})</span> saniye sonra yeni soruya geçiliyor...
                `;
            } else {
                clearInterval(countdownInterval); // Geri sayımı durdur
                messageElement.style.display = "none"; // Popup'ı gizle
                resumeTimer(); // Süreyi tekrar başlat
            }
        }, 1000);
    
        messageElement.innerHTML = `
            ${text}
            ${correctAnswer ? `<div class="correct-answer">Doğru cevap: ${correctAnswer}</div>` : ""}
            <span id="countdown">(${countdown})</span> saniye sonra yeni soruya geçiliyor...
        `;
        messageElement.style.display = "block";
    
        if (type === "correct") {
            messageElement.classList.add("message-popup");
            messageElement.classList.remove("wrong-popup", "pass-popup");
        } else if (type === "wrong") {
            messageElement.classList.add("wrong-popup");
            messageElement.classList.remove("message-popup", "pass-popup");
        } else if (type === "pass") {
            messageElement.classList.add("pass-popup");
            messageElement.classList.remove("message-popup", "wrong-popup");
        }
    }
    
    
    

    function showPopupCorrectWithCountdown(text, type) {
        pauseTimer(); // Süreyi durdur
    
        const messageElement = document.getElementById("countdown-message");
        let countdown = 3;
    
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                messageElement.innerHTML = `
                    ${text}
                    <span id="countdown">(${countdown})</span> saniye sonra yeni soruya geçiliyor...
                `;
            } else {
                clearInterval(countdownInterval); // Geri sayımı durdur
                messageElement.style.display = "none"; // Popup'ı gizle
                resumeTimer(); // Süreyi tekrar başlat
            }
        }, 1000);
    
        messageElement.innerHTML = `${text} <span id="countdown">(${countdown})</span> saniye sonra yeni soruya geçiliyor...`;
        messageElement.style.display = "block";
    
        if (type === "correct") {
            messageElement.classList.add("message-popup");
            messageElement.classList.remove("wrong-popup", "pass-popup");
        } else if (type === "wrong") {
            messageElement.classList.add("wrong-popup");
            messageElement.classList.remove("message-popup", "pass-popup");
        }
    }
    
    

    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.volume = 0.2;
            sound.currentTime = 0;
            sound.play();
        }
    }

    function checkAnswer() {
        stopSound();
        const userAnswer = Array.from(hexagonContainer.querySelectorAll("input"))
            .map(input => input.value.trim().toLowerCase())
            .join("");
    
        const correctAnswer = currentQuestion.answer.toLowerCase();
        const pointsPerLetter = 100;
        const totalPoints = currentAnswerArray.length * pointsPerLetter;
        let pointsLost = 0;
    
        if (userAnswer === correctAnswer) {
            score += totalPoints;
            showPopupCorrectWithCountdown(`Doğru cevap! +${totalPoints} puan kazandınız!`, "correct");
            playSound("correct-sound");
        } else {
            pointsLost = totalPoints / 2;
            score -= pointsLost; // Doğru kayıp puanı yansıtır
            showPopupWithCountdown(
                `Yanlış cevap! -${pointsLost} puan kaybettiniz!`,
                "wrong",
                correctAnswer
            );
            playSound("wrong-sound");
        }
    
        // Ekrandaki puanı güncelle
        scoreDisplay.textContent = `Puan: ${score}`;
        
        // Butonu geçici olarak devre dışı bırak ve sonraki soruya geç
        disableButton(submitAnswerButton, 4000);
        setTimeout(showNextQuestion, 4000);
    }
    

    function wordSound() {
            const sound = document.getElementById("word-sound");
            if (sound) {
                sound.volume = 0.1;
                sound.currentTime = 0;
                sound.play();
            }
    }

    function gameoverSound() {
        const sound = document.getElementById("gameover-sound");
        if (sound) {
            sound.volume = 0.2;
            sound.currentTime = 0;
            sound.play();
        }
}

function revealLetter() {
    if (hintCount >= maxHints || hintDelay) {
        // Eğer maksimum harf açıldıysa veya gecikme aktifse işlem yapılmaz
        message.textContent = `Bu soruda en fazla ${maxHints} harf açabilirsiniz!`;
        return;
    }

    hintDelay = true; // Gecikmeyi başlat
    hintButton.disabled = true; // Butonu geçici olarak devre dışı bırak

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * currentAnswerArray.length);
    } while (revealedIndexes.has(randomIndex));
    wordSound();

    const input = hexagonContainer.querySelector(`input[data-index="${randomIndex}"]`);
    revealedIndexes.add(randomIndex);
    score -= 100; // Puan düşürme
    hintCount++;

    // Animasyon ekleniyor
    const alphabet = "abcdefghijklmnopqrstuvwxyzçğıöşü".split("");
    let iterationCount = 0;
    const maxIterations = 20;
    const intervalDuration = 50;

    const animationInterval = setInterval(() => {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        input.value = randomLetter;
        input.classList.add("flashback");

        iterationCount++;
        if (iterationCount >= maxIterations) {
            clearInterval(animationInterval);

            input.value = currentAnswerArray[randomIndex];
            input.classList.remove("flashback");
            input.classList.add("reveal");
            input.disabled = true;

            scoreDisplay.textContent = `Puan: ${score}`;
            saveGameState(); // Durumu kaydet
        }
    }, intervalDuration);

    // Delay sona eriyor
    setTimeout(() => {
        hintDelay = false; // Gecikmeyi kaldır
        hintButton.disabled = false; // Butonu tekrar etkinleştir
    }, 1500); // 2 saniyelik gecikme
}

function useExtraTime() {
    if (isExtraTimeActive) return;
    isExtraTimeActive = true;
    let extraTimeLeft = 20;
    extraTimeButton.style.display = "none";
    extraTimeDiv.style.display = "block";

    sound = document.getElementById("extra-time-sound");
    sound.currentTime = 0;
    sound.loop = true;
    sound.play();

    extraTimerId = setInterval(() => {
        extraTimeLeft--;
        extraTimeDisplay.textContent = extraTimeLeft;

        if (extraTimeLeft <= 0) {
            clearInterval(extraTimerId);
            isExtraTimeActive = false;
            extraTimeDiv.style.display = "none";

            stopSound();

            showPopupWithCountdown(
                "Ekstra süre doldu! Sıradaki soruya geçiliyor!",
                "wrong",
                currentQuestion.answer
            );
            disableButton(submitAnswerButton, 4000);
            setTimeout(showNextQuestion, 4000);
        }
    }, 1000);
}

    function stopSound() {
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    
    function clearHexagons() {
        const hexagonInputs = hexagonContainer.querySelectorAll("input");
        hexagonInputs.forEach((input) => {
            if (!input.classList.contains("reveal")) {
                input.value = "";
            }
        });
    }

    function passSound() {
        const sound = document.getElementById("pass-sound");
        if (sound) {
            sound.volume = 0.2;
            sound.currentTime = 0;
            sound.play();
        }
    }

    function passStopSound() {
        const sound = document.getElementById("pass-sound");
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    function passQuestion() {
        stopSound();
        if (passCount > 0) {
            passCount--;
            document.getElementById("pass-count").textContent = `Pas Hakları: ${passCount}`;
            passSound();
            showPopupWithCountdown("Soruyu geçtiniz!", "pass", currentQuestion.answer);
            setTimeout(showNextQuestion, 4000);
        } else {
            showPopupMessage("Pas hakkınız kalmadı!", "wrong");
        }
        disableButton(passButton, 4000);
    }

    async function endGame() {
        stopSound();
        gameoverSound();
        clearInterval(timerId);
        clearInterval(extraTimerId);
        localStorage.removeItem("gameState");
        const nickname = localStorage.getItem("nickname");
        const userID = localStorage.getItem("userID");
        const duration = totalTime - timeLeft;
    
        try {
            const response = await fetch("/save-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: nickname, userID, score, duration })
            });
    
            const data = await response.json();
            if (response.ok) {
                alert(`Oyun bitti! Toplam Puan: ${score} kaydedildi. Geçen Süre: ${duration} saniye.`);
            } else {
                console.error("Skor kaydedilemedi:", data.message);
                alert("Skor kaydedilirken hata oluştu: " + data.message);
            }
        } catch (err) {
            console.error("Fetch hatası:", err);
            alert("Veri gönderilirken bir hata oluştu.");
        }
    
        resetGameState();
    }
    
    async function endGameManually() {
        stopSound();
        gameoverSound();
        clearInterval(timerId);
        clearInterval(extraTimerId);
        const nickname = localStorage.getItem("nickname");
        const userID = localStorage.getItem("userID");
        const duration = totalTime - timeLeft;

        try {
            const response = await fetch("/save-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: nickname, userID, score, duration }),
            });

            if (response.ok) {
                alert(`Oyun bitti! Skor: ${score}, Geçen Süre: ${duration} saniye.`);
            } else {
                const data = await response.json();
                console.error("Skor kaydedilemedi:", data.message);
                alert("Skor kaydedilirken hata oluştu: " + data.message);
            }
        } catch (err) {
            console.error("Fetch hatası:", err);
            alert("Veri gönderilirken bir hata oluştu.");
        }

       
        resetGameState();
    }

    function saveGameState() {
        try {
        const gameState = {
            score,
            timeLeft,
            passCount,
            questions,
            currentQuestion,
            currentAnswerArray,
            revealedIndexes: Array.from(revealedIndexes),
            hintCount,
            maxHints,
            isExtraTimeActive,
            extraTimeLeft: parseInt(extraTimeDisplay.textContent) || 0,
            answeredInputs: Array.from(hexagonContainer.querySelectorAll("input")).map(input => input.value)
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
    } catch (error) {
        console.error("Oyun durumu kaydedilemedi:", error);
    }
}

function resetGameState() {
    localStorage.clear(); // Tüm oyun durumunu temizle
    loginScreen.style.display = "block"; // Giriş ekranını göster
    gameScreen.style.display = "none"; // Oyun ekranını gizle
}


    function disableButton(button, duration) {
        button.disabled = true;
        setTimeout(() => {
            button.disabled = false;
        }, duration);
    }

    showScoresButton.addEventListener("click", () => {
        safeExecute(() => {
            loadScores();
        });
        disableButton(showScoresButton, 2000);
        loadScores();
    });

    function safeExecute(func) {
        try {
            func();
        } catch (error) {
            console.error("Bir hata oluştu:", error);
            alert("Bir hata oluştu! Lütfen oyunu yeniden başlatın.");
        }
    }
    
    

    startGameButton.addEventListener("click", startGame);
    submitAnswerButton.addEventListener("click", checkAnswer);
    hintButton.addEventListener("click", revealLetter);
    extraTimeButton.addEventListener("click", useExtraTime);
    passButton.addEventListener("click", passQuestion);
    clearHexagonsButton.addEventListener("click", clearHexagons);
    endGameButton.addEventListener("click", endGameManually);
});

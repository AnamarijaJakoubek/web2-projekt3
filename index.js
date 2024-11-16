const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 100;

// Parametri igre
const brickRows = 8;
const brickColumns = 10;
const ballSpeed = 4;

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Inicijalizacija loptice
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 10,
    dx: ballSpeed * (Math.random() < 0.5 ? -1 : 1),
    dy: -ballSpeed
};

// Inicijalizacija palie
const paddle = {
    width: 100, 
    height: 10, 
    x: canvas.width / 2 - 75, 
    y: canvas.height - 20,
    speed: 7, 
    dx: 0 
};

let moveRight = false;
let moveLeft = false;

// Inicijalizacija cigli
let bricks = [];
const brickWidth = 75;
const brickHeight = 20;

for (let c = 0; c < brickColumns; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRows; r++) {
        bricks[c][r] = { x: 0, y: 0, isActive: 1 }; 
    }
}

// Funkcija za zvukove
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0; 
        sound.play();
    } else {
        console.error("Sound element not found: " + soundId);
    }
}

// Funkcija za crtanje palice
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
    ctx.fillStyle = "red"; 
    ctx.shadowColor = "grey"; 
    ctx.shadowBlur = 10; 
    ctx.fill();
    ctx.closePath();
}

// Funkcija za crtanje loptice
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

// Funkcija za crtanje cigli
function drawBricks() {

    const totalBricksWidth = (brickColumns * brickWidth) + ((brickColumns - 1) * 10); 
    const offsetX = (canvas.width - totalBricksWidth) / 2;

    for (let c = 0; c < brickColumns; c++) {
        for (let r = 0; r < brickRows; r++) {
            if (bricks[c][r].isActive === 1) {
                let brickX = c * (brickWidth + 10) + offsetX;
                let brickY = r * (brickHeight + 10) + 30;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                let brickColor;
                if (r < 2) { 
                    brickColor = "red"; // Prva dva reda su crvena
                } else if (r < 4) { 
                    brickColor = "orange"; // Sljedeća dva reda su narančasta
                } else if (r < 6) { 
                    brickColor = "green"; // Sljedeća dva reda su zelena
                } else { 
                    brickColor = "yellow"; // Preostali redovi su žuti
                }

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = brickColor; 
                ctx.shadowColor = "grey"; 
                ctx.shadowBlur = 5; 
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// Funkcija za prikaz rezultata
function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Score: " + score + "   High Score: " + highScore, canvas.width - 250, 20);
}

// Funckija za provjeru sudara loptice s ciglama
function handleBrickCollision() {
    for (let c = 0; c < brickColumns; c++) {
        for (let r = 0; r < brickRows; r++) {
            let brick = bricks[c][r];
            if (brick.isActive === 1) {

                // Ako je loptica dodirnula ciglu
                if (ball.x + ball.radius >= brick.x && // Desni rub loptice dodiruje ili prelazi lijevi rub cigle
                    ball.x - ball.radius <= brick.x + brickWidth && // Lijevi rub loptice dodiruje ili prelazi desni rub cigle
                    ball.y + ball.radius >= brick.y && // Donji rub loptice dodiruje ili prelazi gornji rub cigle
                    ball.y - ball.radius <= brick.y + brickHeight) {// Gornji rub loptice dodiruje ili prelazi donji rub cigle
                
                    ball.dy = -ball.dy; // Promijeni smjer loptice
                    brick.isActive = 0; // Deaktiviraj ciglu
                    score++;

                    playSound("hitSound");

                    // Ažuriranje rezultata
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('highScore', highScore);
                    }
                    if (score === brickRows * brickColumns) {
                        showModal("VICTORY! You destroyed all the bricks!"); 
                        playSound("victorySound"); 
                    }
                }
            }
        }
    }
     if (score % 10 === 0 && score !== 0) {
         playSound("levelUpSound");  // Zvuk kad igrač pređe okrugli broj bodova
     }
}

let isGameRunning = true;

// Ažuriranje pozicije loptice i palice
function updateBallAndPaddle() {
    if (moveRight && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed; // Pomicanje palice udesno
    }

    if (moveLeft && paddle.x > 0) {
        paddle.x -= paddle.speed; // Pomicanje palice ulijevo
    }

    if (isGameRunning) { // Igra je aktivna
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Ako loptica udari u lijevi ili desni zid
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
            playSound("hitSound"); 
        }
        // Ako loptica udari u gornji zid
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
            playSound("hitSound");

        // Ako loptica udari u dno ekrana 
        } else if (ball.y + ball.radius > canvas.height) {
            showModal("GAME OVER");
            playSound("gameOverSound");
        }
        
        // Ako loptica udari palicu
        if (ball.y + ball.radius > canvas.height - paddle.height - 10 &&
            ball.x > paddle.x && ball.x < paddle.x + paddle.width) {

            const paddleCenterX = paddle.x + paddle.width / 2;
            const ballHitPos = ball.x - paddleCenterX; 

            if (Math.abs(ballHitPos) > paddle.width / 2 - ball.radius) {
                ball.dx = -ball.dx;  
                ball.dy = -ball.dy;  
            } else {
                ball.dy = -ball.dy;
            }

           playSound("hitSound"); // Zvuk udarca
        }
    }
}

// Funkcija za prikaz tekstualne obavijesti 
function showModal(message) {
    isGameRunning = false; 
    const modal = document.getElementById("gameModal");
    const modalTitle = document.getElementById("modalTitle");

    modalTitle.textContent = message; 
    modal.style.display = "flex"; 

    const restartButton = document.getElementById("restartButton");
    restartButton.addEventListener("click", function () {
        modal.style.display = "none";
        document.location.reload(); 
    });
}

// Glavna funckija za crtanje
function draw() {
    if (!isGameRunning) return; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    handleBrickCollision();
    updateBallAndPaddle();
    requestAnimationFrame(draw);
}

// Funkcija za praćenje tipki za pomicanje palice
document.addEventListener("keydown", function(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        moveRight = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        moveLeft = true;
    }
});

document.addEventListener("keyup", function(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        moveRight = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        moveLeft = false;
    }
});

draw(); // Započni igru
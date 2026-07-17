const lines = [
"INITIALIZING TERMINAL...",
"",
"Loading kernel.............OK",
"Loading modules............OK",
"Mounting filesystem........OK",
"Loading user profile.......OK",
"Establishing CRT link......OK",
"",
"Welcome, Sanjay Kumar Mandal.",
"Launching interface..."
];

const boot = document.getElementById("boot-screen");
const text = document.getElementById("boot-text");

let line = 0;

function typeNext(){

    if(line >= lines.length){

        setTimeout(()=>{

            boot.classList.add("hidden");

        },500);

        return;
    }

    text.textContent += lines[line] + "\n";

    line++;

    setTimeout(typeNext,120);
}

window.addEventListener("load",()=>{

    typeNext();

});

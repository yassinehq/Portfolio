        // Dark mode toggle
        const themeToggle = document.getElementById('themeToggle');
        const htmlElement = document.documentElement;
        const iconElement = themeToggle.querySelector('i');

        // Vérifier le thème sauvegardé
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });

        function updateIcon(theme) {
            if (theme === 'dark') {
                iconElement.className = 'fas fa-sun';
            } else {
                iconElement.className = 'fas fa-moon';
            }
        }

        // Animation du texte de salutation
        const greetings = [
            "Hello,<br>I'm Yassine!",
            "Bonjour,<br>Je suis Yassine !",
            "¡Hola!<br>Soy Yassine!",
            "<span dir='rtl'>مرحبا،<br>أنا ياسين!</span>",
            "Hallo,<br>Ich bin Yassine!",
            "Ciao,<br>Sono Yassine!",
            "Привет,<br>Я Ясин!",
            "你好，<br>我是 亚辛！",
            "こんにちは、<br>私は ヤシン です！",
            "안녕하세요,<br>저는 야신입니다!",
            "नमस्ते,<br>मैं यासीन हूँ!",
            "Γεια σου,<br>Είμαι ο Γιασίν!"
        ];

        let currentIndex = 0;
        const greetingElement = document.getElementById("greetingText");
        
        function wrapLetters(text) {
            let result = '';
            let i = 0;
            
            while (i < text.length) {
                if (text[i] === '<') {
                    let tagEnd = text.indexOf('>', i);
                    result += text.substring(i, tagEnd + 1);
                    i = tagEnd + 1;
                }
                else if (text[i] === ' ') {
                    result += ' ';
                    i++;
                }
                else {
                    result += `<span>${text[i]}</span>`;
                    i++;
                }
            }
            return result;
        }
        
        function changeGreeting() {
            const spans = greetingElement.querySelectorAll('span');
            
            spans.forEach((span, index) => {
                setTimeout(() => {
                    span.classList.add('letter-out');
                }, index * 30);
            });
            
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % greetings.length;
                const newText = greetings[currentIndex];
                greetingElement.innerHTML = wrapLetters(newText);
                
                const newSpans = greetingElement.querySelectorAll('span');
                
                newSpans.forEach((span, index) => {
                    span.classList.add('letter-in');
                    setTimeout(() => {
                        span.classList.remove('letter-in');
                    }, index * 30);
                });
            }, spans.length * 30 + 200);
        }
        
        greetingElement.innerHTML = wrapLetters(greetings[0]);
        setInterval(changeGreeting, 4000);

        // Gestion des images décoratives
        const poses = ["Pose 1.png", "Pose 2.png", "Pose 3.png", "Pose 4.png"];
        const container = document.getElementById("worldImages");
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const shuffledPoses = [...poses].sort(() => Math.random() - 0.5);
        const spacing = pageHeight / (poses.length + 1);

        shuffledPoses.forEach((pose, index) => {
            const img = document.createElement("img");
            img.src = pose;
            
            if (index % 2 === 0) {
                img.style.left = "20px";
            } else {
                img.style.right = "20px";
            }
            
            img.style.top = (spacing * (index + 1)) + "px";
            container.appendChild(img);
        });

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
// JavaScript for AI Study Helper

document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const darkModeToggle = document.getElementById('darkModeToggle');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const dropZone = document.getElementById('dropZone');
    let pdfUpload = document.getElementById('pdfUpload');
    let browseButton = document.getElementById('browseButton');
    const syllabusText = document.getElementById('syllabusText');
    const analyzeButton = document.getElementById('analyzeButton');
    const spinner = document.getElementById('spinner');
    const examDownload = document.getElementById('examDownload');
    const answerKeyDownload = document.getElementById('answerKeyDownload');
    const downloadSection = document.getElementById('downloadSection');
    const questionCountSlider = document.getElementById('questionCount');
    const questionCountValue = document.getElementById('questionCountValue');
    const difficultyLevel = document.getElementById('difficultyLevel');

    // Initialize PDF.js worker 
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    // OpenRouter API key 
    const OPENROUTER_API_KEY = "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";
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
        });
    }

    // Mobile menu toggle
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // FAQ toggles on plans page
    const faqToggles = document.querySelectorAll('.faq-toggle');
    if (faqToggles.length > 0) {
        faqToggles.forEach(toggle => {
            toggle.addEventListener('click', function () {
                const content = this.nextElementSibling;
                content.classList.toggle('hidden');

                // Rotate the chevron icon
                const icon = this.querySelector('i');
                icon.classList.toggle('transform');
                icon.classList.toggle('rotate-180');
            });
        });
    }

    // Plan selection on plans page
    const planButtons = document.querySelectorAll('.planButton');
    if (planButtons.length > 0) {
        planButtons.forEach(button => {
            button.addEventListener('click', function () {
                const planType = this.getAttribute('data-plan');

                // Remove checkmarks from all plans
                document.querySelectorAll('.checkmark').forEach(mark => {
                    mark.classList.add('hidden');
                });

                // Show checkmark for selected plan
                const planElement = this.parentElement;
                const checkmark = planElement.querySelector('.checkmark');
                checkmark.classList.remove('hidden');

                // Visual confirmation
                alert(`You've selected the ${planType} plan!`);

                // Store selection in localStorage
                localStorage.setItem('selectedPlan', planType);
            });
        });
    }

    // Question count slider
    if (questionCountSlider && questionCountValue) {
        questionCountSlider.addEventListener('input', function () {
            questionCountValue.textContent = this.value;
        });
    }

    // File upload handlers
    if (dropZone && pdfUpload && browseButton) {
        // Handle file drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-500');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-blue-500');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500');

            if (e.dataTransfer.files.length) {
                pdfUpload.files = e.dataTransfer.files;
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });

        // Handle browse button click
        browseButton.addEventListener('click', () => {
            pdfUpload.click();
        });

        // Handle file selection via the input
        pdfUpload.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }

    // Function to handle file selection (used by both drop and browse)
    async function handleFileSelection(file) {
        if (!file) return;

        // Check if file is PDF
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            pdfUpload.value = '';
            return;
        }

        // Show loading state
        const uploadStatus = document.createElement('p');
        uploadStatus.textContent = `Reading ${file.name}...`;
        uploadStatus.className = 'mt-2 text-sm text-blue-500';

        // Remove any previous status
        const prevStatus = dropZone.querySelector('.text-blue-500');
        if (prevStatus) {
            prevStatus.remove();
        }

        dropZone.appendChild(uploadStatus);

        try {
            // Extract text from the PDF
            const extractedText = await extractTextFromPDF(file);

            // Update status
            uploadStatus.textContent = `Successfully processed: ${file.name}`;
            uploadStatus.className = 'mt-2 text-sm text-green-500';

            // Put the extracted text in the textarea if it exists
            if (syllabusText) {
                syllabusText.value = extractedText;
                syllabusText.style.height = 'auto';
                syllabusText.style.height = `${syllabusText.scrollHeight}px`;
            }

        } catch (error) {
            console.error('Error processing PDF:', error);
            uploadStatus.textContent = 'Failed to read PDF. Please try another file.';
            uploadStatus.className = 'mt-2 text-sm text-red-500';
            pdfUpload.value = '';
        }
    }

    // Add PDF.js extraction functionality
    function extractTextFromPDF(pdfFile) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();

            fileReader.onload = async function (event) {
                try {
                    const typedArray = new Uint8Array(event.target.result);

                    // Load PDF using PDF.js
                    const loadingTask = pdfjsLib.getDocument({ data: typedArray });

                    try {
                        const pdf = await loadingTask.promise;
                        let text = '';

                        // Extract text from each page
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const pageText = content.items.map(item => item.str).join(' ');
                            text += pageText + ' ';
                        }

                        resolve(text.trim());
                    } catch (pdfError) {
                        console.error('PDF.js error:', pdfError);
                        reject(pdfError);
                    }
                } catch (error) {
                    console.error('PDF extraction error:', error);
                    reject(error);
                }
            };

            fileReader.onerror = function (event) {
                console.error('FileReader error:', event);
                reject(new Error('Error reading file'));
            };

            fileReader.readAsArrayBuffer(pdfFile);
        });
    }

    // Process text and generate exam
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async () => {
            const text = syllabusText.value.trim();

            if (!text) {
                alert('Please upload a PDF or enter study material text first.');
                return;
            }

            // Show spinner and hide download buttons
            spinner.classList.remove('hidden');
            downloadSection.classList.add('hidden');

            try {
                // Get the selected question count and difficulty
                const questionCount = questionCountSlider.value;
                const difficulty = difficultyLevel.value;

                // Generate the exam using OpenRouter API
                const result = await generateExam(text, questionCount, difficulty);

                if (result && result.exam && result.answers) {
                    const { exam, answers } = result;
                    // Determine desired output format
                    const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;

                    if (outputFormat === 'pdf') {
                        // Use jsPDF to generate PDFs
                        const { jsPDF } = window.jspdf;

                        // Create Practice Exam PDF with improved styling
                        const examDoc = new jsPDF();
                        examDoc.setFont('helvetica');
                        examDoc.setFontSize(12);
                        const margin = 15;
                        const lineHeight = 7;
                        let cursorY = margin;
                        const pageHeight = examDoc.internal.pageSize.height;
                        const maxWidth = examDoc.internal.pageSize.width - margin * 2;
                        // Wrap and render each paragraph
                        exam.split("\n").forEach(paragraph => {
                            const lines = examDoc.splitTextToSize(paragraph, maxWidth);
                            lines.forEach(textLine => {
                                if (cursorY > pageHeight - margin) { examDoc.addPage(); cursorY = margin; }
                                examDoc.text(textLine, margin, cursorY);
                                cursorY += lineHeight;
                            });
                            cursorY += lineHeight / 2;
                        });
                        const examBlob = examDoc.output('blob');

                        // Create Answer Key PDF with improved styling
                        const answersDoc = new jsPDF();
                        answersDoc.setFont('helvetica');
                        answersDoc.setFontSize(12);
                        let cursorA = margin;
                        // same margins and width
                        answers.split("\n").forEach(paragraph => {
                            const linesA = answersDoc.splitTextToSize(paragraph, maxWidth);
                            linesA.forEach(textLine => {
                                if (cursorA > pageHeight - margin) { answersDoc.addPage(); cursorA = margin; }
                                answersDoc.text(textLine, margin, cursorA);
                                cursorA += lineHeight;
                            });
                            cursorA += lineHeight / 2;
                        });
                        const answersBlob = answersDoc.output('blob');

                        examDownload.href = URL.createObjectURL(examBlob);
                        examDownload.download = 'generated-exam.pdf';

                        answerKeyDownload.href = URL.createObjectURL(answersBlob);
                        answerKeyDownload.download = 'answer-key.pdf';
                    } else {
                        // Fallback: plain text files
                        const examBlob = new Blob([exam], { type: 'text/plain' });
                        const answersBlob = new Blob([answers], { type: 'text/plain' });

                        examDownload.href = URL.createObjectURL(examBlob);
                        examDownload.download = 'generated-exam.txt';

                        answerKeyDownload.href = URL.createObjectURL(answersBlob);
                        answerKeyDownload.download = 'answer-key.txt';
                    }
                    // Show download buttons
                    downloadSection.classList.remove('hidden');
                } else {
                    throw new Error('Failed to generate exam');
                }
            } catch (error) {
                console.error('Error generating exam:', error);
                alert('There was an error generating your exam. Please try again.');
            } finally {
                // Hide spinner
                spinner.classList.add('hidden');
            }
        });
    }

    // Function to generate exam using OpenRouter API
    async function generateExam(syllabusContent, questionCount, difficulty) {
        try {
            // Prepare the prompt for the AI
            const prompt = `
                Create an exam with ${questionCount} multiple-choice questions based on the following study material.
                Difficulty level: ${difficulty}
                
                Study Material:
                ${syllabusContent.substring(0, 8000)} ${syllabusContent.length > 8000 ? '(truncated for length)' : ''}
                
                Format the output as follows:
                1. Start with an exam title and brief instructions.
                2. Number each question starting from 1.
                3. Each question should have exactly 4 options labeled A, B, C, and D.
                4. Do not include answers in the exam.
                5. After all questions, provide a separate answer key with just the question number and correct letter.
            `;

            // Call the OpenRouter API
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'StudyAi Exam Generator'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-exp:free',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert educator who creates high-quality exam questions based on study materials.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response from API');
            }

            const aiResponse = data.choices[0].message.content;

            // Extract exam and answers from the AI response
            return parseExamAndAnswers(aiResponse);
        } catch (error) {
            console.error('Error in generateExam:', error);
            throw error;
        }
    }

    // Function to parse the AI response and separate exam from answer key
    function parseExamAndAnswers(aiResponse) {
        // Look for answer key section indicators
        const answerKeyMarkers = [
            'ANSWER KEY',
            'Answer Key',
            'ANSWERS',
            'Answers:',
            'Answer key:'
        ];

        let splitPosition = -1;

        for (const marker of answerKeyMarkers) {
            const position = aiResponse.indexOf(marker);
            if (position !== -1) {
                splitPosition = position;
                break;
            }
        }

        if (splitPosition === -1) {
            // If no clear marker is found, try to find a pattern like "1. A" or "1) A"
            const answerPattern = /\n\s*(\d+[\.)]\s*[A-D])/;
            const match = aiResponse.match(answerPattern);

            if (match) {
                splitPosition = match.index;
            } else {
                // If we still can't find a split, return everything as the exam
                return {
                    exam: aiResponse,
                    answers: 'Unable to parse answer key automatically.'
                };
            }
        }

        // Split the response
        const exam = aiResponse.substring(0, splitPosition).trim();
        const answers = aiResponse.substring(splitPosition).trim();

        return {
            exam,
            answers
        };
    }

    // Function to reset the form and results
    function resetForm() {
        if (syllabusText) syllabusText.value = '';
        if (pdfUpload) pdfUpload.value = '';
        if (downloadSection) downloadSection.classList.add('hidden');

        // Reset upload status if exists
        const uploadStatus = dropZone.querySelector('.text-green-500, .text-red-500, .text-blue-500');
        if (uploadStatus) {
            uploadStatus.remove();
        }
    }

    // Add reset button functionality if exists
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetForm);
    }
});
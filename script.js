import * as pdfjsLib from './pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.mjs';

async function extractPDFText(file) {

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

        const page = await pdf.getPage(pageNum);

        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map(item => item.str)
            .join(" ");

        fullText += " " + pageText;
    }

    return fullText.toLowerCase();
}

function calculateATS(resumeText, jdText) {

    let matchedKeywords = [];
    let missingKeywords = [];

    ATS_KEYWORDS.forEach(keyword => {

        const key = keyword.toLowerCase();

        const inResume = resumeText.includes(key);
        const inJD = jdText.includes(key);

        if (inResume && inJD) {

            matchedKeywords.push(keyword);

        } else if (inJD) {

            missingKeywords.push(keyword);
        }

    });

    let score = 0;

    const totalKeywords =
        matchedKeywords.length +
        missingKeywords.length;

    if (totalKeywords > 0) {

        score = Math.round(
            (matchedKeywords.length / totalKeywords) * 100
        );
    }

    return {
        score,
        matchedKeywords,
        missingKeywords
    };
}

window.analyzeResume = async function () {

    const resume1Input =
        document.getElementById("resume1");

    const resume2Input =
        document.getElementById("resume2");

    const jdText =
        document.getElementById("jobDescription")
        .value
        .toLowerCase();

    if (resume1Input.files.length === 0) {

        alert("Please upload Resume 1");
        return;
    }

    if (resume2Input.files.length === 0) {

        alert("Please upload Resume 2");
        return;
    }

    if (jdText.trim() === "") {

        alert("Please paste Job Description");
        return;
    }

    document.getElementById("result").innerHTML =
        "<h2>Comparing Resumes...</h2>";

    try {

        const resume1Text =
            await extractPDFText(
                resume1Input.files[0]
            );

        const resume2Text =
            await extractPDFText(
                resume2Input.files[0]
            );

        const result1 =
            calculateATS(
                resume1Text,
                jdText
            );

        const result2 =
            calculateATS(
                resume2Text,
                jdText
            );

        let winner = "Tie";

        if (result1.score > result2.score) {

            winner =
                resume1Input.files[0].name;

        } else if (
            result2.score > result1.score
        ) {

            winner =
                resume2Input.files[0].name;
        }

        document.getElementById("result").innerHTML = `

        <div class="cards">

            <div class="card">
                <h2>Resume 1 Score</h2>
                <p>${result1.score}%</p>
            </div>

            <div class="card">
                <h2>Resume 2 Score</h2>
                <p>${result2.score}%</p>
            </div>

            <div class="card">
                <h2>Resume 1 Matches</h2>
                <p>${result1.matchedKeywords.length}</p>
            </div>

            <div class="card">
                <h2>Resume 2 Matches</h2>
                <p>${result2.matchedKeywords.length}</p>
            </div>

        </div>

        <div class="result-box">

            <h2>🏆 Recommended Resume</h2>

            <h1>${winner}</h1>

            <hr>

            <h3>Why This Resume Won</h3>

            <ul>
                <li>Higher ATS Score</li>
                <li>More matching keywords</li>
                <li>Better alignment with Job Description</li>
            </ul>

            <hr>

            <h3>📄 Resume 1 Analysis</h3>

            <p>
                <strong>File:</strong>
                ${resume1Input.files[0].name}
            </p>

            <p>
                <strong>ATS Score:</strong>
                ${result1.score}%
            </p>

            <h4>💪 Top Strengths</h4>

            <ul>
                ${result1.matchedKeywords
                    .slice(0, 5)
                    .map(skill => `<li>✅ ${skill}</li>`)
                    .join("")}
            </ul>

            <h4>🎯 Top Missing Skills</h4>

            <ul>
                ${result1.missingKeywords
                    .slice(0, 5)
                    .map(skill => `<li>❌ ${skill}</li>`)
                    .join("")}
            </ul>

            <hr>

            <h3>📄 Resume 2 Analysis</h3>

            <p>
                <strong>File:</strong>
                ${resume2Input.files[0].name}
            </p>

            <p>
                <strong>ATS Score:</strong>
                ${result2.score}%
            </p>

            <h4>💪 Top Strengths</h4>

            <ul>
                ${result2.matchedKeywords
                    .slice(0, 5)
                    .map(skill => `<li>✅ ${skill}</li>`)
                    .join("")}
            </ul>

            <h4>🎯 Top Missing Skills</h4>

            <ul>
                ${result2.missingKeywords
                    .slice(0, 5)
                    .map(skill => `<li>❌ ${skill}</li>`)
                    .join("")}
            </ul>

            <hr>

            <h3>📊 ATS Summary</h3>

            <p>
                ${winner} has the stronger keyword match against the Job Description and is recommended for application.
            </p>

            <h3>💡 Recommendations</h3>

            <ul>
                <li>Add missing keywords where relevant.</li>
                <li>Include measurable achievements.</li>
                <li>Highlight business impact and outcomes.</li>
                <li>Strengthen leadership and stakeholder management examples.</li>
                <li>Tailor the resume for each application.</li>
            </ul>

        </div>
        `;

    } catch (error) {

        console.error(error);

        document.getElementById("result").innerHTML = `

        <div class="result-box">

            <h2>Error</h2>

            <p>${error.message}</p>

        </div>

        `;
    }
};

window.downloadReport = function () {

    const report =
        document.getElementById("result")
        .innerText;

    const blob = new Blob(
        [report],
        {
            type: "text/plain"
        }
    );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "ATS_Comparison_Report.txt";

    link.click();
};
document.getElementById("wireForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const neededArea = parseFloat(document.getElementById("neededArea").value);
    const underDiameter = parseFloat(document.getElementById("underDiameter").value);

    const material = document.getElementById("material").value;     // screen
    const surrounding = document.getElementById("surrounding").value;
    const thetaI = parseFloat(document.getElementById("thetaI").value);
    const thetaF = parseFloat(document.getElementById("thetaF").value);
    const t = parseFloat(document.getElementById("t").value);
    const F = parseFloat(document.getElementById("F").value);

    if (
        [neededArea, underDiameter, thetaI, thetaF, t, F].some(
        (v) => isNaN(v) || v <= 0
        )
    ) {
        alert("Please enter valid numeric values.");
        return;
    }

    // ---- constants (from your spec) ----
    const conductorData = {
    Cu: { K: 226, beta: 234.5, sigmaC: 3.45 },
    Al: { K: 148, beta: 228.0, sigmaC: 2.50 },
    Pb: { K: 41,  beta: 230.0, sigmaC: 1.45 },     // lead alloy
    Steel: { K: 78, beta: 202.0, sigmaC: 3.80 }
    };

    const surroundData = {
    PVC: { sigma: 1.7, rho: 5.0 },
    PE:  { sigma: 2.4, rho: 3.5 },
    LS0H:{ sigma: 1.7, rho: 5.0 },
    SC:  { sigma: 2.4, rho: 2.5 }
    };

    // empirical constants for ε per IEC 60949 (clause 5)
    const C1 = 2464;              // mm/m
    const C2 = 1.22;              // K·m·mm²/J

    // helper: format numbers
const fx = (n, d=2) => Number(n).toLocaleString(undefined, {maximumFractionDigits:d});

    const { K, beta, sigmaC } = conductorData[material];
    const { sigma, rho } = surroundData[surrounding];


    const resultsTable = document.querySelector("#resultsTable tbody");
    resultsTable.innerHTML = "";

    const standardDiameters = [0.5, 0.54, 0.55, 0.58, 0.6, 0.61, 0.615, 0.62, 0.66, 0.664, 
                               0.67, 0.672, 0.735, 0.76, 0.77, 0.82, 0.85, 0.9, 0.91, 0.92, 
                               0.93, 0.98, 1, 1.01, 1.03, 1.037, 1.05, 1.06, 1.09, 1.17, 1.19,1.2,1.31,1.35,1.36,1.365,1.37,1.385,1.4,
                              1.47,1.5,1.52,1.53,1.57,1.6,1.62,1.63,1.68,1.7,1.74,1.78,1.8,1.82,1.83,1.9,1.921,1.96,2,2.01,2.05,
                              2.1,2.12,2.19,2.2,2.22,2.24,2.32,2.33,2.46,2.48,2.5,2.52,2.58,2.59,2.6,2.82,2.85,2.9,2.91,2.915,
                              2.96,3.33,3.57,3.76,3.84,4.2];

    const lnTerm = Math.log((thetaF + beta) / (thetaI + beta));   // dimensionless
    const A = (C1/(sigmaC*Math.pow(10,6))) * Math.sqrt((((sigma+2.4)/2)*Math.pow(10,6))/((rho+2.5)/2));//always semi con below screen (2.4 and 2.5 values)
    const B =(C2/(sigmaC*Math.pow(10,6))) * (((sigma+2.4)/2)*Math.pow(10,6))/((rho+2.5)/2);//always semi con below screen (2.4 and 2.5 values)


    standardDiameters.forEach(diameter => {
    const wireArea = Math.PI / 4 * diameter * diameter;
    const tempNbWires = Math.ceil(neededArea / wireArea);

        let nbBobbins;
        if (diameter < 1.2) {
            nbBobbins = 4;
        } else {
            nbBobbins = tempNbWires % 2 === 0 ? 2 : 1;
        }

        const nbElements = Math.ceil(tempNbWires / nbBobbins);
        const totalNbWires = nbElements * nbBobbins;
        const areaCalculated = wireArea * totalNbWires;     // S (mm²)        
        const gapCalculated = (Math.PI * (underDiameter + diameter) / totalNbWires) - (1.03 * diameter);
        const weight = areaCalculated * 8.89;

        if (gapCalculated > 0.1 && gapCalculated < 4) {
            if ((totalNbWires < 126 && diameter < 1.35) || (totalNbWires < 84 && diameter > 1.35)) {
                if ((areaCalculated / neededArea) < 1.1) {


                    // I_AD^2 * t = K^2 * S^2 * lnTerm
                    const Iad =(K * areaCalculated * Math.sqrt(lnTerm / t)/1000);
                    const Iad_without =(K * (areaCalculated+1.5) * Math.sqrt(lnTerm / t)/1000);
                    // ε = sqrt( 1 + F*A*sqrt(t/S) + F^2*B*(t/S) )
                    const eps = Math.sqrt(1 + (F * A * Math.sqrt(t / wireArea)) + ((F * F) * B * (t / wireArea))
                    );
                    const Inon = eps * Iad;
                    const Inon_without = eps * Iad_without;



                    const row = resultsTable.insertRow();
                    row.innerHTML = `
                    <td>${nbElements} × ${nbBobbins} × ${diameter.toFixed(3)}</td>
                    <td>${fx(areaCalculated, 3)}</td>
                    <td>${fx(gapCalculated, 3)}</td>
                    <td>${fx(weight, 3)}</td>
                    <td>${fx(Iad,3)}</td>
                    <td>${fx(Iad_without,3)}</td>
                    <td>${fx(Inon, 3)}</td>
                    <td>${fx(Inon_without, 3)}</td>
                    <td>${fx(eps, 3)}</td>
                                     `;
                }
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & DATA ---
    let currentStep = 1;
    const formData = {};

    const packages = {
        'euro': {
            name: 'Eurotravesía Mixta',
            baseCost: 3840990,
            destinations: ['Barcelona', 'Londres', 'Paris', 'Venecia', 'Roma'],
            inclusions: ['Vuelos ida y vuelta', 'Hotel', 'Desayuno', 'Traslados internos', 'Team Leader', 'Entrada Coliseo Romano']
        },
        'machu': {
            name: 'Grupal Machu Picchu',
            baseCost: 990990,
            destinations: ['Cuzco', 'Machu Picchu', 'Valle Sagrado'],
            inclusions: ['Vuelos Santiago-Cuzco', 'Hotel', 'Desayuno', 'Tours Bicicletada', 'Tren a Aguas Calientes']
        },
        'rapa-nui': {
            name: 'Grupal Rapa Nui',
            baseCost: 1190990,
            destinations: ['Rapa Nui'],
            inclusions: ['Vuelos Santiago-Rapa Nui', 'Hotel', 'Desayuno', 'Tours Roais y Anakena', 'Show polinésico', 'Entrada parque nacional']
        }
    };

    // --- DOM ELEMENTS ---
    const form = document.getElementById('contract-form');
    const steps = document.querySelectorAll('.step');
    const stepLabels = document.querySelectorAll('.step-label');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');

    // --- EVENT LISTENERS ---
    form.addEventListener('input', handleFormInput);
    nextBtn.addEventListener('click', nextStep);
    prevBtn.addEventListener('click', prevStep);
    generatePdfBtn.addEventListener('click', generatePDF);
    document.getElementById('packageSelector').addEventListener('change', handlePackageChange);

    // --- FUNCTIONS ---
    function handleFormInput(e) {
        formData[e.target.id] = e.target.value;
        
        // Trigger calculations if relevant fields change
        if (['passengerCount', 'downPayment', 'installments'].includes(e.target.id)) {
            calculatePayments();
        }
        
        updateSidebar();
    }

    function handlePackageChange() {
        const selectedPackageKey = document.getElementById('packageSelector').value;
        if (!selectedPackageKey) return;
        
        const pkg = packages[selectedPackageKey];
        formData.packageKey = selectedPackageKey;
        formData.packageName = pkg.name;
        formData.baseCost = pkg.baseCost;
        
        // Populate package details in the form
        const destinationsContainer = document.getElementById('packageDestinations');
        destinationsContainer.innerHTML = pkg.destinations.map(d => `<span class="tag">${d}</span>`).join('');

        const inclusionsContainer = document.getElementById('packageInclusions');
        inclusionsContainer.innerHTML = pkg.inclusions.map(i => `
            <div>
                <input type="checkbox" id="inc-${i.replace(/\s+/g, '-')}" checked disabled>
                <label for="inc-${i.replace(/\s+/g, '-')}">${i}</label>
            </div>
        `).join('');

        calculatePayments();
        updateSidebar();
    }

    function calculatePayments() {
        const passengerCount = parseInt(formData.passengerCount) || 1;
        const baseCost = parseFloat(formData.baseCost) || 0;
        const totalCost = passengerCount * baseCost;
        
        const downPayment = parseFloat(formData.downPayment) || 0;
        const balanceDue = totalCost - downPayment;
        
        const installments = parseInt(formData.installments) || 1;
        const installmentAmount = balanceDue > 0 ? balanceDue / installments : 0;

        formData.totalCost = totalCost;
        formData.balanceDue = balanceDue;
        formData.installmentAmount = installmentAmount;

        // Update form fields
        document.getElementById('totalCost').value = formatCurrency(totalCost);
        document.getElementById('balanceDue').value = formatCurrency(balanceDue);
        document.getElementById('installmentAmount').value = formatCurrency(installmentAmount);

        generatePaymentTable('payment-table-container');
    }
    
    function generatePaymentTable(containerId) {
        const container = document.getElementById(containerId);
        if (!formData.totalCost) {
            container.innerHTML = "<p>Complete los datos del paquete y los pagos.</p>";
            return;
        }

        let tableHTML = `<table class="payment-table">
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Monto (CLP)</th>
                </tr>
            </thead>
            <tbody>`;

        const today = new Date();
        const downPayment = parseFloat(formData.downPayment) || 0;
        if (downPayment > 0) {
            tableHTML += `
                <tr>
                    <td>Abono Inicial</td>
                    <td>${today.toLocaleDateString('es-CL')}</td>
                    <td>${formatCurrency(downPayment)}</td>
                </tr>`;
        }

        const installments = parseInt(formData.installments) || 1;
        const installmentAmount = parseFloat(formData.installmentAmount) || 0;
        if (installmentAmount > 0) {
            for (let i = 1; i <= installments; i++) {
                const paymentDate = new Date(today);
                paymentDate.setMonth(today.getMonth() + i);
                tableHTML += `
                    <tr>
                        <td>Cuota ${i} de ${installments}</td>
                        <td>${paymentDate.toLocaleDateString('es-CL')}</td>
                        <td>${formatCurrency(installmentAmount)}</td>
                    </tr>`;
            }
        }
        
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    function updateSidebar() {
        document.getElementById('sidebar-client-name').textContent = formData.clientName || 'N/A';
        document.getElementById('sidebar-passengers').textContent = formData.passengerCount || 'N/A';
        document.getElementById('sidebar-package-name').textContent = formData.packageName || 'N/A';
        document.getElementById('sidebar-dates').textContent = formData.startDate && formData.endDate ? `${formData.startDate} a ${formData.endDate}` : 'N/A';
        document.getElementById('sidebar-downpayment').textContent = formatCurrency(formData.downPayment || 0);
        document.getElementById('sidebar-installments').textContent = formData.installmentAmount > 0 ? `${formData.installments} de ${formatCurrency(formData.installmentAmount)}` : 'N/A';
        document.getElementById('sidebar-total-cost').textContent = formatCurrency(formData.totalCost || 0);
    }
    
    function updateSummary() {
        const pkg = packages[formData.packageKey];
        document.getElementById('summary-clientName').textContent = formData.clientName;
        document.getElementById('summary-clientRUT').textContent = formData.clientRUT;
        document.getElementById('summary-packageName').textContent = formData.packageName;
        document.getElementById('summary-dates').textContent = `${formData.startDate} a ${formData.endDate}`;
        document.getElementById('summary-passengers').textContent = formData.passengerCount;
        document.getElementById('summary-destinations').textContent = pkg.destinations.join(', ');
        document.getElementById('summary-totalCost').textContent = formatCurrency(formData.totalCost);
        document.getElementById('summary-downPayment').textContent = formatCurrency(formData.downPayment);
        document.getElementById('summary-installments-count').textContent = formData.installments;
        document.getElementById('summary-installmentAmount').textContent = formatCurrency(formData.installmentAmount);
        generatePaymentTable('summary-payment-schedule');
    }

    function updateWizardView() {
        steps.forEach(step => step.classList.remove('active'));
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

        stepLabels.forEach(label => {
            const stepNum = parseInt(label.dataset.step);
            label.classList.remove('active', 'completed');
            if (stepNum < currentStep) {
                label.classList.add('completed');
            } else if (stepNum === currentStep) {
                label.classList.add('active');
            }
        });

        prevBtn.disabled = currentStep === 1;
        nextBtn.style.display = currentStep === 4 ? 'none' : 'inline-block';
        generatePdfBtn.style.display = currentStep === 4 ? 'inline-block' : 'none';
    }

    function nextStep() {
        // Simple validation
        if (currentStep === 1 && (!formData.clientName || !formData.passengerCount)) {
            alert('Por favor, complete el nombre del cliente y el número de pasajeros.');
            return;
        }
        if (currentStep === 2 && !formData.packageKey) {
             alert('Por favor, seleccione un paquete de viaje.');
            return;
        }

        if (currentStep < 4) {
            currentStep++;
            if (currentStep === 4) {
                updateSummary();
            }
            updateWizardView();
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateWizardView();
        }
    }

    function generatePDF() {
        const element = document.getElementById('pdf-preview');
        const clientName = formData.clientName.replace(/\s+/g, '_') || 'Cliente';
        const options = {
            margin: 0.5,
            filename: `Contrato_Orbitravel_${clientName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(element).set(options).save();
    }

    // --- UTILS ---
    function formatCurrency(value) {
        if (isNaN(value)) return 'CLP 0';
        return `CLP ${Math.round(value).toLocaleString('es-CL')}`;
    }

    // --- INITIALIZATION ---
    updateWizardView();
});

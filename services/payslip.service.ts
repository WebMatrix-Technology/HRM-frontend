import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payroll } from './payroll.service';

export const payslipService = {
    generatePayslip: (payroll: Payroll) => {
        const doc = new jsPDF();

        // Company Header
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text('WebMatrix Agency', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Payslip for the period of', 105, 30, { align: 'center' });
        doc.text(`${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 105, 36, { align: 'center' });

        // Employee Details
        doc.setDrawColor(200);
        doc.line(14, 45, 196, 45);

        doc.setFontSize(10);
        doc.setTextColor(0);

        const leftX = 14;
        const rightX = 110;
        let y = 55;
        const lineHeight = 7;

        const emp = payroll.employeeId; // This is populated

        // Left Column
        doc.text(`Employee ID: ${emp.employeeId}`, leftX, y);
        doc.text(`Name: ${emp.firstName} ${emp.lastName}`, leftX, y + lineHeight);
        doc.text(`Department: ${emp.department || 'N/A'}`, leftX, y + lineHeight * 2);
        doc.text(`Designation: ${emp.position || 'N/A'}`, leftX, y + lineHeight * 3);

        // Right Column
        doc.text(`PAN: ${emp.pan || 'N/A'}`, rightX, y);
        doc.text(`Bank Account: ${emp.bankDetails?.accountNumber || 'N/A'}`, rightX, y + lineHeight);
        doc.text(`IFSC: ${emp.bankDetails?.ifscCode || 'N/A'}`, rightX, y + lineHeight * 2);
        doc.text(`Joining Date: ${emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}`, rightX, y + lineHeight * 3);

        doc.line(14, y + lineHeight * 4 + 5, 196, y + lineHeight * 4 + 5);

        // Earnings & Deductions Table
        y = y + lineHeight * 4 + 15;

        // Prepare deductions rows
        const deductionRows = [];
        if (payroll.leaveDeduction && payroll.leaveDeduction > 0) {
            deductionRows.push(['Leave Deduction (LOP)', formatCurrency(payroll.leaveDeduction)]);
        }
        if (payroll.absentDeduction && (payroll.absentDeduction as any) > 0) {
           deductionRows.push(['Absent Deduction', formatCurrency(payroll.absentDeduction as any)]);
        }
        if (payroll.idleDeduction && payroll.idleDeduction > 0) {
            deductionRows.push(['Idle Time Deduction', formatCurrency(payroll.idleDeduction)]);
        }

        // Fill remaining rows if needed or add a generic "Other" if deductions > sum of specific ones
        const specificSum = (payroll.leaveDeduction || 0) + (payroll.idleDeduction || 0) + ((payroll.absentDeduction as any) || 0);
        const otherDeduction = Math.max(0, payroll.deductions - specificSum);
        if (otherDeduction > 0.01) {
            deductionRows.push(['Other Deductions', formatCurrency(otherDeduction)]);
        }

        // Static rows for PF/TDS
        const pfRow = ['PF', formatCurrency(payroll.pf || 0)];
        const tdsRow = ['TDS', formatCurrency(payroll.tds || 0)];

        autoTable(doc, {
            startY: y,
            head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
            body: [
                ['Basic Salary', formatCurrency(payroll.basicSalary), pfRow[0], pfRow[1]],
                ['HRA', formatCurrency(payroll.hra || 0), tdsRow[0], tdsRow[1]],
                ['Special Allowance', formatCurrency(payroll.specialAllowance || 0), deductionRows[0]?.[0] || '', deductionRows[0]?.[1] || ''],
                ['Travel Allowance', formatCurrency(payroll.travelAllowance || 0), deductionRows[1]?.[0] || '', deductionRows[1]?.[1] || ''],
                ['', '', deductionRows[2]?.[0] || '', deductionRows[2]?.[1] || ''],
                ['Total Earnings', formatCurrency(payroll.basicSalary + (payroll.hra || 0) + (payroll.specialAllowance || 0) + (payroll.travelAllowance || 0)), 'Total Deductions', formatCurrency((payroll.pf || 0) + (payroll.tds || 0) + payroll.deductions)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                1: { halign: 'right' },
                3: { halign: 'right' },
            },
        });

        // Net Pay
        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFillColor(240, 240, 240);
        doc.rect(14, finalY, 182, 15, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Net Pay:', 20, finalY + 10);
        doc.text(formatCurrency(payroll.netSalary), 190, finalY + 10, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text('This is a system generated payslip and does not require signature.', 105, 280, { align: 'center' });

        // Save
        doc.save(`Payslip_${emp.firstName}_${emp.lastName}_${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'short' })}_${payroll.year}.pdf`);
    }
};

const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0);
    return `Rs. ${formatted}`;
};

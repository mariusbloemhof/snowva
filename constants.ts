// Business constants - VAT rate and company details only
export const VAT_RATE = 0.15;

export const SNOWVA_DETAILS = {
    name: 'Snowva™ Trading Pty Ltd',
    regNo: '2010/007043/07',
    address: [
        '67 Wildevy Street',
        'Lynnwood Manor',
        'Pretoria'
    ],
    vatNo: '4100263500',
    banking: {
        bankName: 'First National Bank',
        branchCode: '250 655',
        accountNumber: '62264885082'
    }
};

// All customer, product, invoice, quote, and payment data should now come from Firebase
// If you see TypeScript errors, it means something is still trying to import mock data from here
import { motion } from 'motion/react';
import { HiOutlineDocumentText, HiOutlineCheck, HiOutlineBan, HiOutlineClock, HiOutlineDownload } from 'react-icons/hi';
import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ContractCard({ contract, onUpdate }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const isClient = contract.clientId._id === user?.userId;
    const isFreelancer = contract.freelancerId._id === user?.userId;

    const handleAction = async (status) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(
                `${API_BASE_URL}/api/contracts/${contract._id}/status`,
                { status },
                { headers: { Authorization: token } }
            );

            onUpdate && onUpdate(response.data.contract);
        } catch (err) {
            console.error('Error updating contract:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const doc = new jsPDF();
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // --- Background & Watermark ---
        doc.setFillColor(248, 250, 252); // Very light gray/blue background
        doc.rect(0, 0, width, height, 'F');

        doc.setTextColor(240, 240, 240);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text('ORIGINAL', width / 2, height / 2, { align: 'center', angle: 45 });

        // --- Border ---
        doc.setLineWidth(2);
        doc.setDrawColor(100, 100, 100);
        doc.rect(10, 10, width - 20, height - 20);
        doc.setLineWidth(0.5);
        doc.rect(12, 12, width - 24, height - 24);

        // --- Header (e-Stamp Style) ---
        // Header Background
        doc.setFillColor(230, 240, 230); // Light green for header
        doc.rect(13, 13, width - 26, 40, 'F');

        // Govt Label
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('PROLANCE', width / 2, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('e-Stamp', width / 2, 32, { align: 'center' });

        // Certificate Details
        doc.setFontSize(9);
        doc.text(`Certificate No.    : IN-${contract._id.slice(0, 10).toUpperCase()}`, 20, 42);
        doc.text(`Certificate Issued : ${new Date().toLocaleString()}`, 20, 48);
        doc.text(`Account Reference  : PROLANCE-BOND-${new Date().getFullYear()}`, width - 80, 42);
        doc.text(`Unique Doc. Ref.   : ${contract._id}`, width - 80, 48);

        // --- Main Title ---
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(22, 100, 50); // Dark Green
        doc.text('WORK CONTRACT AGREEMENT', width / 2, 70, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(40, 72, width - 40, 72);

        // --- Agreement Text ---
        let yPos = 90;
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const introText = `THIS AGREEMENT is made on this ${new Date(contract.status === 'accepted' ? contract.updatedAt : Date.now()).toLocaleDateString()} by and between:`;
        doc.text(introText, 25, yPos);
        yPos += 15;

        // Parties Box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(25, yPos, width - 50, 35, 2, 2, 'FD');

        const clientText = `FIRST PARTY (Client): ${contract.clientId.name}`;
        const freelancerText = `SECOND PARTY (Freelancer): ${contract.freelancerId.name}`;

        doc.setFont('times', 'bold');
        doc.text(clientText, 30, yPos + 12);
        doc.text(freelancerText, 30, yPos + 24);

        yPos += 50;

        // Content
        doc.setFont('times', 'normal');
        const bodyText = `WHEREAS, the First Party has a requirement for certain services and the Second Party has agreed to provide such services under the following terms and conditions:

1. PROJECT TITLE: ${contract.contractDetails.title}

2. SCOPE OF WORK:
${contract.contractDetails.scope}

3. FINANCIALS:
The agreed consideration for the services is INR ${contract.contractDetails.finalAmount.toLocaleString()}.

4. TIMELINE:
The duration of the project shall be ${contract.contractDetails.duration}, commencing from ${new Date(contract.contractDetails.startDate).toLocaleDateString()}.

5. PAYMENT TERMS:
${contract.contractDetails.paymentTerms}`;

        const splitBody = doc.splitTextToSize(bodyText, width - 50);
        doc.text(splitBody, 25, yPos);
        yPos += (splitBody.length * 6) + 10;

        // Deliverables (if fit)
        if (contract.contractDetails.deliverables?.length > 0 && yPos < height - 60) {
            doc.text('6. DELIVERABLES:', 25, yPos);
            yPos += 6;
            contract.contractDetails.deliverables.forEach(d => {
                doc.text(`- ${d}`, 30, yPos);
                yPos += 6;
            });
        }

        // --- footer / Signatures ---
        yPos = Math.max(yPos + 20, height - 60);

        doc.setFont('times', 'bold');
        doc.text('For First Party', 40, yPos);
        doc.text('For Second Party', width - 80, yPos);

        // Stamps
        if (contract.status === 'accepted') {
            // Circle Stamp
            doc.setDrawColor(0, 100, 0); // Dark Green
            doc.setLineWidth(1);
            doc.circle(width - 60, yPos + 15, 12);
            doc.setFontSize(8);
            doc.setTextColor(0, 100, 0);
            doc.text('APPROVED', width - 60, yPos + 15, { align: 'center' });
            doc.text('PROLANCE', width - 60, yPos + 12, { align: 'center', angle: 30 }); // Curved-ish text hack

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('(Digitally Signed)', 40, yPos + 20);
            doc.text('(Digitally Signed)', width - 80, yPos + 20);
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('(Pending Signature)', 40, yPos + 20);
            doc.text('(Pending Signature)', width - 80, yPos + 20);
        }

        doc.save(`Bond_Agreement_${contract._id}.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'accepted': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'rejected': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-4 p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-900 border-2 border-green-200 dark:border-green-800 rounded-lg shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <HiOutlineDocumentText size={24} className="text-green-600 dark:text-green-500" />
                    <div>
                        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Work Contract Proposal</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-0.5">
                            Proposed by {contract.freelancerId.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                        title="Download Contract PDF"
                    >
                        <HiOutlineDownload size={20} />
                    </button>
                    <span className={`px-3 py-1 text-xs rounded-full border font-light ${getStatusColor(contract.status)}`}>
                        {contract.status}
                    </span>
                </div>
            </div>

            {/* Contract Details */}
            <div className="space-y-3 mb-4">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Project Title</p>
                    <p className="text-sm font-normal text-gray-800 dark:text-gray-200">{contract.contractDetails.title}</p>
                </div>

                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Scope of Work</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-light line-clamp-3">{contract.contractDetails.scope}</p>
                </div>

                {contract.contractDetails.deliverables?.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Deliverables</p>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 font-light space-y-1">
                            {contract.contractDetails.deliverables.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-500 mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Project Amount</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">
                            ₹{contract.contractDetails.finalAmount.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Duration</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">{contract.contractDetails.duration}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Start Date</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">
                            {new Date(contract.contractDetails.startDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Payment Terms</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">{contract.contractDetails.paymentTerms}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {contract.status === 'pending' && isClient && (
                <div className="flex gap-2 pt-3 border-t border-green-200 dark:border-green-800">
                    <button
                        onClick={() => handleAction('accepted')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-green-600 dark:bg-green-500 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition font-light cursor-pointer disabled:opacity-50"
                    >
                        <HiOutlineCheck size={16} />
                        Accept Contract
                    </button>
                    <button
                        onClick={() => handleAction('rejected')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-light cursor-pointer disabled:opacity-50"
                    >
                        <HiOutlineBan size={16} />
                        Reject
                    </button>
                </div>
            )}

            {contract.status === 'accepted' && (
                <div className="flex items-center gap-2 pt-3 border-t border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 font-light">
                    <HiOutlineCheck size={16} />
                    <span>Contract accepted • Project assigned to {contract.freelancerId.name}</span>
                </div>
            )}

            {contract.status === 'rejected' && contract.clientNotes && (
                <div className="pt-3 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Client Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-light">{contract.clientNotes}</p>
                </div>
            )}

            {contract.status === 'pending' && isFreelancer && (
                <div className="flex items-center gap-2 pt-3 border-t border-green-200 dark:border-green-800 text-sm text-yellow-700 dark:text-yellow-400 font-light">
                    <HiOutlineClock size={16} />
                    <span>Waiting for client's response</span>
                </div>
            )}
        </motion.div>
    );
}

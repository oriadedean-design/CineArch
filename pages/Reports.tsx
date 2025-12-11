
import React from 'react';
import { Heading, Text, Card, Button } from '../components/ui';
import { Download, Lock, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/storage';
import { User } from '../types';

export const Reports = ({ user }: { user: User }) => {
  const jobs = api.jobs.list();
  // const user = api.auth.getUser(); // Use prop instead of local fetch
  const totalHours = jobs.reduce((acc, curr) => acc + curr.totalHours, 0);
  const totalEarnings = jobs.reduce((acc, curr) => acc + (curr.grossEarnings || 0), 0);
  const totalDeductions = jobs.reduce((acc, curr) => acc + (curr.unionDeductions || 0), 0);

  const handleDownload = () => {
    if (!user?.isPremium) {
      alert("Reporting is a Premium feature.");
      return;
    }
    alert("In a real app, this would generate a PDF via a library like @react-pdf/renderer or a backend service.");
  };

  const handleBulkUpload = () => {
    if (!user?.isPremium) {
      alert("Bulk Import is a Premium feature.");
      return;
    }
    alert("Mock CSV Import Triggered.");
  };

  return (
    <div className="space-y-8">
      <Heading>Reports & Analytics</Heading>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="col-span-2 p-8">
          <Heading level={2}>Career & Union Report</Heading>
          <Text className="mt-2 mb-6">Generate a comprehensive summary of jobs, eligibility progress, and financial deductions.</Text>
          
          <div className="bg-neutral-50 p-6 rounded-lg mb-6 font-mono text-xs text-neutral-600 relative">
             {!user?.isPremium && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                   <Lock className="w-8 h-8 text-neutral-400 mb-2"/>
                   <span className="font-bold text-neutral-900">PREMIUM FEATURE</span>
                </div>
             )}
            <p className="font-bold border-b border-neutral-200 pb-2 mb-2">REPORT PREVIEW</p>
            <div className="flex justify-between mb-1"><span>Total Jobs Recorded:</span> <span>{jobs.length}</span></div>
            <div className="flex justify-between mb-1"><span>Total Hours:</span> <span>{totalHours}</span></div>
            <div className="flex justify-between mb-1 pt-2 border-t border-neutral-200 mt-2"><span>Gross Earnings (Est):</span> <span>${totalEarnings.toFixed(2)}</span></div>
            <div className="flex justify-between mb-1"><span>Union Deductions:</span> <span>${totalDeductions.toFixed(2)}</span></div>
            <div className="flex justify-between mt-4"><span>Generated:</span> <span>{new Date().toLocaleDateString()}</span></div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleDownload} disabled={!user?.isPremium}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button variant="secondary" onClick={handleDownload} disabled={!user?.isPremium}>Download CSV</Button>
          </div>
        </Card>
        
        <div className="space-y-6">
           <Card className="p-6 bg-blue-50 border-blue-100">
             <h3 className="font-bold text-blue-900">Pro Tip</h3>
             <p className="text-sm text-blue-800 mt-2">Ensure all your attachments are legible before exporting. The report will include links to your uploaded proofs. IATSE members should double check deduction totals against pay stubs.</p>
           </Card>

           <Card className="p-6 bg-[#121212] text-white">
             <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4"/> Bulk Import</h3>
             <p className="text-sm text-neutral-400 mt-2 mb-4">Have an existing spreadsheet? Import your history in seconds.</p>
             <Button variant="outline" className="w-full text-xs text-white border-white hover:bg-white hover:text-black" onClick={handleBulkUpload}>
               Upload CSV
             </Button>
           </Card>
        </div>
      </div>
    </div>
  );
};

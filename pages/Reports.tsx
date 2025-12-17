
import React from 'react';
import { Heading, Text, Card, Button } from '../components/ui';
import { Download, Lock, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/storage';

export const Reports = () => {
  const jobs = api.jobs.list();
  const user = api.auth.getUser();
  const totalHours = jobs.reduce((acc, curr) => acc + curr.totalHours, 0);
  const totalEarnings = jobs.reduce((acc, curr) => acc + (curr.grossEarnings || 0), 0);
  const totalDeductions = jobs.reduce((acc, curr) => acc + (curr.unionDeductions || 0), 0);

  const handleDownload = () => {
    // Unlocked feature
    alert("In a real app, this would generate a PDF via a library like @react-pdf/renderer or a backend service.");
  };

  const handleBulkUpload = () => {
    // Unlocked feature
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
            <p className="font-bold border-b border-neutral-200 pb-2 mb-2">REPORT PREVIEW</p>
            <div className="flex justify-between mb-1"><span>Total Jobs Recorded:</span> <span>{jobs.length}</span></div>
            <div className="flex justify-between mb-1"><span>Total Hours:</span> <span>{totalHours}</span></div>
            <div className="flex justify-between mb-1 pt-2 border-t border-neutral-200 mt-2"><span>Gross Earnings (Est):</span> <span>${totalEarnings.toFixed(2)}</span></div>
            <div className="flex justify-between mb-1"><span>Union Deductions:</span> <span>${totalDeductions.toFixed(2)}</span></div>
            <div className="flex justify-between mt-4"><span>Generated:</span> <span>{new Date().toLocaleDateString()}</span></div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button variant="secondary" onClick={handleDownload}>Download CSV</Button>
          </div>
        </Card>
        
        <div className="space-y-6">
           <Card className="p-6 bg-blue-900/20 border-blue-800">
             <h3 className="font-bold text-blue-300">Pro Tip</h3>
             <p className="text-sm text-blue-200 mt-2">Ensure all your attachments are legible before exporting. The report will include links to your uploaded proofs. IATSE members should double check deduction totals against pay stubs.</p>
           </Card>

           <Card className="p-6 bg-surfaceHighlight border border-white/10 text-white">
             <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4"/> Bulk Import</h3>
             <p className="text-sm text-textTertiary mt-2 mb-4">Have an existing spreadsheet? Import your history in seconds.</p>
             <Button variant="outline" className="w-full text-xs text-white border-white hover:bg-white hover:text-black" onClick={handleBulkUpload}>
               Upload CSV
             </Button>
           </Card>
        </div>
      </div>
    </div>
  );
};

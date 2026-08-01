import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useImportStudents } from '@/hooks/useImportStudents';
import { useStudents } from '@/hooks/useStudents';
import {
  parseImportFile,
  type ImportParseResult,
  type ValidatedRow,
} from '@/utils/studentImport';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface ImportStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'result';

export function ImportStudentsModal({ open, onOpenChange }: ImportStudentsModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingStudents = [] } = useStudents();
  const importMutation = useImportStudents();

  const resetState = useCallback(() => {
    setStep('upload');
    setParseResult(null);
    setParseError(null);
    setIsParsing(false);
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetState();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetState]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsParsing(true);
      setParseError(null);

      try {
        const existingIds = existingStudents.map(s => s.studentId);
        const result = await parseImportFile(file, existingIds);
        setParseResult(result);
        setStep('preview');
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Failed to parse file');
      } finally {
        setIsParsing(false);
      }
    },
    [existingStudents]
  );

  const handleImport = useCallback(async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const studentsToImport = validRows.map(row => ({
      studentId: row.studentId,
      firstName: row.firstName,
      lastName: row.lastName,
      gradeLevel: row.gradeLevel,
      email: row.email || undefined,
      phone: row.phone || undefined,
    }));

    try {
      const result = await importMutation.mutateAsync(studentsToImport);
      setImportedCount(result.length);
      setStep('result');
    } catch {
      // Error is handled by the mutation's onError callback
    }
  }, [parseResult, importMutation]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && fileInputRef.current) {
        // Create a new DataTransfer to set the file on the input
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        // Trigger the change handler
        handleFileSelect({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple students at once.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <UploadStep
              fileInputRef={fileInputRef}
              isParsing={isParsing}
              parseError={parseError}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          )}

          {step === 'preview' && parseResult && (
            <PreviewStep parseResult={parseResult} />
          )}

          {step === 'result' && (
            <ResultStep
              importedCount={importedCount}
              skippedCount={parseResult?.errorCount || 0}
            />
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  importMutation.isPending || !parseResult || parseResult.validCount === 0
                }
              >
                {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {parseResult?.validCount || 0} Student
                {parseResult?.validCount === 1 ? '' : 's'}
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components ---

function UploadStep({
  fileInputRef,
  isParsing,
  parseError,
  onFileSelect,
  onDrop,
  onDragOver,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isParsing: boolean;
  parseError: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Template download */}
      <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Download Template</p>
            <p className="text-sm text-blue-700 mt-1">
              Use our template to format your data correctly. Student ID is optional — leave it
              blank to auto-generate one.
            </p>
            <a
              href="/templates/student_import_template.csv"
              download="student_import_template.csv"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </a>
          </div>
        </div>
      </div>

      {/* File upload dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 transition-colors"
      >
        {isParsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-600">Parsing file...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700">
              Drag and drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">Supports CSV and Excel (.xlsx, .xls) files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{parseError}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">Required columns:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-500">
          <li><span className="font-mono text-xs">first_name</span> — Student's first name</li>
          <li><span className="font-mono text-xs">last_name</span> — Student's last name</li>
          <li>
            <span className="font-mono text-xs">grade_level</span> — e.g. "9th Grade", "Pre-K",
            or just "9"
          </li>
        </ul>
        <p className="font-medium mt-3">Optional columns:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-500">
          <li>
            <span className="font-mono text-xs">student_id</span> — Leave blank to auto-generate
          </li>
          <li><span className="font-mono text-xs">email</span></li>
          <li><span className="font-mono text-xs">phone</span></li>
        </ul>
      </div>
    </div>
  );
}

function PreviewStep({ parseResult }: { parseResult: ImportParseResult }) {
  const { rows, validCount, errorCount, totalCount } = parseResult;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Total: {totalCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700">{validCount} valid</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{errorCount} with errors</span>
          </div>
        )}
      </div>

      {/* Warning for errors */}
      {errorCount > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800">
              Rows with errors will be skipped. Only valid rows will be imported.
            </p>
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className="rounded-md border overflow-x-auto max-h-[350px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Row</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Student ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Grade</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row: ValidatedRow) => (
              <tr
                key={row.rowNumber}
                className={row.isValid ? '' : 'bg-red-50'}
              >
                <td className="px-3 py-2 text-gray-500">{row.rowNumber}</td>
                <td className="px-3 py-2">
                  {row.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {row.studentId}
                  {row.isAutoId && (
                    <span className="ml-1 text-xs text-blue-600 font-normal">(auto)</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {row.lastName}{row.firstName ? `, ${row.firstName}` : ''}
                </td>
                <td className="px-3 py-2">{row.gradeLevel}</td>
                <td className="px-3 py-2 text-red-600 text-xs">
                  {row.errors.map(err => err.message).join('; ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultStep({
  importedCount,
  skippedCount,
}: {
  importedCount: number;
  skippedCount: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-gray-900">Import Complete</p>
        <p className="text-sm text-gray-600">
          Successfully imported {importedCount} student{importedCount === 1 ? '' : 's'}.
        </p>
        {skippedCount > 0 && (
          <p className="text-sm text-yellow-700">
            {skippedCount} row{skippedCount === 1 ? ' was' : 's were'} skipped due to errors.
          </p>
        )}
      </div>
    </div>
  );
}

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import type { AthleteImportBatch, AthleteImportSummary } from "@repo/utils";
import { AlertCircle, CheckCircle2, FileUp, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";

import {
  useAthleteImportBatch,
  useAthleteImports,
  useAthleteImportSeasons,
  useConfirmAthleteImport,
  usePreviewAthleteImport,
} from "../use-athlete-import";

function SummaryColumn({
  title,
  created,
  updated,
  unchanged,
}: {
  title: string;
  created: number;
  updated: number;
  unchanged: number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{title}</p>
      <dl className="text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt>New</dt>
          <dd className="text-foreground text-lg font-semibold">{created}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd className="text-foreground text-lg font-semibold">{updated}</dd>
        </div>
        <div>
          <dt>Unchanged</dt>
          <dd className="text-foreground text-lg font-semibold">{unchanged}</dd>
        </div>
      </dl>
    </div>
  );
}

function ImportHistory() {
  const imports = useAthleteImports();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent imports</CardTitle>
        <CardDescription>The last 20 LRBA previews and confirmed imports.</CardDescription>
      </CardHeader>
      <CardContent>
        {imports.isPending && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {imports.isError && (
          <p className="text-destructive py-6 text-center text-sm">
            Could not load import history.
          </p>
        )}
        {imports.data?.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">No LRBA imports yet.</p>
        )}
        {imports.data && imports.data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.filename}</TableCell>
                  <TableCell>{item.season.label}</TableCell>
                  <TableCell>
                    <Badge variant={item.state === "FAILED" ? "destructive" : "secondary"}>
                      {item.state.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.summary.rows.toLocaleString()}</TableCell>
                  <TableCell>{item.createdAt.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ImportSummary({ summary }: { summary: AthleteImportSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Preview summary</h3>
        <Badge variant="secondary">{summary.rows.toLocaleString()} rows</Badge>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <SummaryColumn
          title="Athletes"
          created={summary.athletesCreated}
          updated={summary.athletesUpdated}
          unchanged={summary.athletesUnchanged}
        />
        <SummaryColumn
          title="Athlete seasons"
          created={summary.athleteSeasonsCreated}
          updated={summary.athleteSeasonsUpdated}
          unchanged={summary.athleteSeasonsUnchanged}
        />
        <SummaryColumn
          title="Clubs"
          created={summary.clubsCreated}
          updated={summary.clubsUpdated}
          unchanged={summary.clubsUnchanged}
        />
      </div>
    </div>
  );
}

function ImportStatus({ batch }: { batch: AthleteImportBatch }) {
  if (batch.state === "APPLIED") {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>Import applied</AlertTitle>
        <AlertDescription>The LRBA athlete directory was updated atomically.</AlertDescription>
      </Alert>
    );
  }
  if (batch.state === "FAILED") {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>
          {batch.errorMessage ?? "The worker could not apply this import."}
        </AlertDescription>
      </Alert>
    );
  }
  if (batch.state === "QUEUED" || batch.state === "PROCESSING") {
    return (
      <Alert>
        <Loader2 className="animate-spin" />
        <AlertTitle>{batch.state === "QUEUED" ? "Import queued" : "Importing athletes"}</AlertTitle>
        <AlertDescription>
          You can leave this page. The result is stored with the import batch.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

export function AthleteCsvImport() {
  const seasons = useAthleteImportSeasons();
  const preview = usePreviewAthleteImport();
  const confirm = useConfirmAthleteImport();
  const [seasonCode, setSeasonCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewBatch, setPreviewBatch] = useState<AthleteImportBatch | null>(null);
  const currentBatch = useAthleteImportBatch(previewBatch?.id);
  const batch = currentBatch.data ?? previewBatch;
  const selectedSeasonCode = seasonCode || seasons.data?.defaultSeasonCode || "";

  const seasonItems =
    seasons.data?.seasons.map((season) => ({
      value: season.code,
      label: `${season.label}${season.exists ? "" : " · created on confirmation"}`,
    })) ?? [];

  const chooseFile = (nextFile: File | undefined) => {
    setFile(nextFile ?? null);
    setPreviewBatch(null);
  };

  const handlePreview = async () => {
    if (!file || !selectedSeasonCode) return;
    setPreviewBatch(await preview.mutateAsync({ file, seasonCode: selectedSeasonCode }));
  };

  const handleConfirm = async () => {
    if (!file || !batch) return;
    setPreviewBatch(await confirm.mutateAsync({ file, batchId: batch.id }));
  };

  const pending = preview.isPending || confirm.isPending;
  const canConfirm =
    batch?.state === "PREVIEW" || batch?.state === "FAILED" || batch?.state === "EXPIRED";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            LRBA athlete directory
          </CardTitle>
          <CardDescription>
            Preview and apply the official tab-separated LRBA athlete export. Missing athletes are
            left untouched.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md space-y-2">
            <Label htmlFor="athlete-season">Athletics season</Label>
            <Select
              value={selectedSeasonCode || null}
              onValueChange={(value) => {
                setSeasonCode(value ?? "");
                setPreviewBatch(null);
              }}
              items={seasonItems}
              disabled={seasons.isPending || seasons.isError}
            >
              <SelectTrigger id="athlete-season" className="w-full">
                <SelectValue placeholder="Select an LRBA season" />
              </SelectTrigger>
              <SelectContent>
                {seasonItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {seasons.isError && (
              <p className="text-destructive text-sm">Could not load LRBA seasons.</p>
            )}
          </div>

          <div
            className="border-muted-foreground/30 hover:border-primary/60 rounded-xl border-2 border-dashed p-8 text-center transition-colors"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files[0]);
            }}
          >
            <UploadCloud className="text-muted-foreground mx-auto size-9" />
            <p className="mt-3 font-medium">Drop the LRBA export here</p>
            <p className="text-muted-foreground mt-1 text-sm">
              The source is a tab-separated file with a .csv extension, up to 20 MiB.
            </p>
            <Label htmlFor="lrba-file" className="sr-only">
              LRBA athlete export
            </Label>
            <Input
              id="lrba-file"
              type="file"
              accept=".csv,text/csv"
              className="mx-auto mt-4 max-w-sm"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {file && (
              <p className="mt-3 text-sm">
                <FileUp className="mr-2 inline size-4" />
                {file.name} · {(file.size / 1_024 / 1_024).toFixed(2)} MiB
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handlePreview}
              disabled={
                !file ||
                !selectedSeasonCode ||
                pending ||
                batch?.state === "QUEUED" ||
                batch?.state === "PROCESSING"
              }
            >
              {preview.isPending && <Loader2 className="animate-spin" />}Preview import
            </Button>
          </div>

          {batch && (
            <>
              <Separator />
              <ImportSummary summary={batch.summary} />
              <ImportStatus batch={batch} />
              {canConfirm && (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-muted-foreground text-sm">
                    Confirmation updates all rows in one transaction. The original file is not
                    retained.
                  </p>
                  <Button onClick={handleConfirm} disabled={pending}>
                    {confirm.isPending && <Loader2 className="animate-spin" />}Confirm import
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <ImportHistory />
    </div>
  );
}

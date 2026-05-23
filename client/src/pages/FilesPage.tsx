import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  File,
  FileText,
  Image,
  Music,
  Video,
  Trash2,
  Download,
  BookOpen,
  Headphones,
  PenLine,
  FolderOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Category = "vocabulary" | "grammar" | "listening" | "reading" | "other";

const CATEGORY_LABELS: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  vocabulary: { label: "词汇 (어휘)", icon: BookOpen, color: "bg-[#FFB100] text-[#1E1E1E]" },
  grammar: { label: "语法 (문법)", icon: PenLine, color: "bg-[#FF6B35] text-white" },
  listening: { label: "听力 (듣기)", icon: Headphones, color: "bg-[#2EC4B6] text-[#1E1E1E]" },
  reading: { label: "阅读 (읽기)", icon: BookOpen, color: "bg-[#1E1E1E] text-white" },
  other: { label: "其他 (기타)", icon: FolderOpen, color: "bg-gray-200 text-[#1E1E1E]" },
};

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

const ALLOWED_EXTENSIONS = [
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".mp3", ".wav", ".ogg", ".m4a", ".mp4",
  ".txt", ".doc", ".docx",
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType === "application/pdf" || mimeType.includes("word")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FilesPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: "uploading" | "done" | "error" }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState<Category>("other");
  const [pendingDescription, setPendingDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: files, isLoading } = trpc.files.list.useQuery();

  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
      toast.success("文件上传成功！파일 업로드 완료! 🎉");
    },
    onError: (err) => {
      toast.error(`上传失败：${err.message}`);
    },
  });

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
      toast.success("文件已删除 파일 삭제 완료");
      setDeleteDialogId(null);
    },
    onError: (err) => {
      toast.error(`删除失败：${err.message}`);
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`文件过大（最大 16MB）：${file.name}`);
      return;
    }
    // Validate extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`不支持的文件格式：${ext}`);
      return;
    }
    setPendingFile(file);
    setPendingCategory("other");
    setPendingDescription("");
    setUploadDialogOpen(true);
  }, []);

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;

    setUploadDialogOpen(false);
    setUploadingFiles(prev => [...prev, { name: pendingFile.name, progress: "uploading" }]);

    try {
      const base64Data = await fileToBase64(pendingFile);
      await uploadMutation.mutateAsync({
        filename: pendingFile.name,
        mimeType: pendingFile.type || "application/octet-stream",
        base64Data,
        fileSize: pendingFile.size,
        category: pendingCategory,
        description: pendingDescription || undefined,
      });
      setUploadingFiles(prev =>
        prev.map(f => f.name === pendingFile.name ? { ...f, progress: "done" } : f)
      );
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.name !== pendingFile.name));
      }, 2000);
    } catch {
      setUploadingFiles(prev =>
        prev.map(f => f.name === pendingFile.name ? { ...f, progress: "error" } : f)
      );
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.name !== pendingFile.name));
      }, 3000);
    }

    setPendingFile(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const filteredFiles = files?.filter(f =>
    selectedCategory === "all" || f.category === selectedCategory
  ) ?? [];

  const categoryCounts = files?.reduce((acc, f) => {
    const cat = f.category as Category;
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<Category, number>>) ?? {};

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1E1E] font-sans pb-12">
      {/* Header */}
      <header className="border-b-4 border-[#1E1E1E] bg-[#2EC4B6] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB100] rounded-full translate-x-16 -translate-y-16 border-4 border-[#1E1E1E] z-0" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#1E1E1E] text-white px-3 py-1 text-xs font-black uppercase tracking-widest mb-3 border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <FolderOpen className="w-3.5 h-3.5 text-[#FFB100]" /> 학습 자료 보관함
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            学习资料管理
          </h1>
          <p className="text-base font-bold text-[#1E1E1E] mt-1">
            上传并管理你的韩语学习资料（PDF、音频、图片等）
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-4 border-dashed border-[#1E1E1E] p-10 text-center cursor-pointer transition-all select-none ${
            isDragOver
              ? "bg-[#FFB100] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
              : "bg-white hover:bg-[#FAF9F5] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 border-4 border-[#1E1E1E] flex items-center justify-center transition-colors ${isDragOver ? "bg-[#1E1E1E]" : "bg-[#FFB100]"}`}>
              <Upload className={`w-8 h-8 ${isDragOver ? "text-[#FFB100]" : "text-[#1E1E1E]"}`} />
            </div>
            <div>
              <p className="text-lg font-black">
                {isDragOver ? "松开以上传文件 파일을 놓으세요!" : "拖拽文件到此处，或点击选择文件"}
              </p>
              <p className="text-sm font-bold text-[#666] mt-1">
                支持 PDF、图片、音频、Word 文档 · 最大 16MB
              </p>
              <p className="text-xs text-[#888] mt-1">
                {ALLOWED_EXTENSIONS.join("  ")}
              </p>
            </div>
          </div>
        </div>

        {/* Uploading Progress */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            {uploadingFiles.map(f => (
              <div key={f.name} className={`border-2 border-[#1E1E1E] p-3 flex items-center gap-3 ${
                f.progress === "done" ? "bg-[#D1F7D1]" : f.progress === "error" ? "bg-[#FFD1D1]" : "bg-white"
              }`}>
                {f.progress === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />}
                {f.progress === "done" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {f.progress === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                <span className="text-sm font-bold truncate flex-1">{f.name}</span>
                <span className="text-xs font-black text-[#888]">
                  {f.progress === "uploading" ? "上传中..." : f.progress === "done" ? "完成！" : "失败"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 text-sm font-black border-2 border-[#1E1E1E] transition-all ${
              selectedCategory === "all"
                ? "bg-[#1E1E1E] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-[#FAF9F5]"
            }`}
          >
            全部 (전체) {files?.length ? `(${files.length})` : ""}
          </button>
          {(Object.entries(CATEGORY_LABELS) as [Category, typeof CATEGORY_LABELS[Category]][]).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 text-sm font-black border-2 border-[#1E1E1E] transition-all flex items-center gap-1.5 ${
                selectedCategory === key
                  ? `${cat.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                  : "bg-white hover:bg-[#FAF9F5]"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
              {categoryCounts[key] ? ` (${categoryCounts[key]})` : ""}
            </button>
          ))}
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
            <span className="ml-3 font-black text-[#888]">加载中... 로딩 중</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white border-4 border-[#1E1E1E] p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 bg-[#FAF9F5] border-2 border-[#1E1E1E] flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-[#888]" />
            </div>
            <h3 className="text-xl font-black text-[#888]">
              {selectedCategory === "all" ? "还没有上传任何文件" : `该分类暂无文件`}
            </h3>
            <p className="text-sm font-bold text-[#AAA] mt-2">
              点击上方区域或拖拽文件开始上传学习资料
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map(file => {
              const FileIcon = getFileIcon(file.mimeType);
              const catInfo = CATEGORY_LABELS[file.category as Category] ?? CATEGORY_LABELS.other;
              return (
                <div
                  key={file.id}
                  className="bg-white border-4 border-[#1E1E1E] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex flex-col gap-3"
                >
                  {/* File Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-[#FAF9F5] border-2 border-[#1E1E1E] flex items-center justify-center shrink-0">
                      <FileIcon className="w-6 h-6 text-[#FF6B35]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm leading-tight truncate" title={file.filename}>
                        {file.filename}
                      </h4>
                      <p className="text-xs text-[#888] font-bold mt-0.5">
                        {formatFileSize(file.fileSize)} · {new Date(file.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 border border-[#1E1E1E] ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    <span className="text-[10px] font-bold text-[#888] truncate">
                      {file.mimeType}
                    </span>
                  </div>

                  {/* Description */}
                  {file.description && (
                    <p className="text-xs font-medium text-[#555] border-t border-dashed border-[#DDD] pt-2 line-clamp-2">
                      {file.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2 border-t-2 border-[#1E1E1E]">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FFB100] border-2 border-[#1E1E1E] text-xs font-black hover:bg-[#FF6B35] hover:text-white transition-colors active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      查看/下载
                    </a>
                    <button
                      onClick={() => setDeleteDialogId(file.id)}
                      className="px-3 py-2 bg-white border-2 border-[#1E1E1E] text-xs font-black hover:bg-[#FFD1D1] transition-colors active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Confirm Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="border-4 border-[#1E1E1E] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">上传文件设置</DialogTitle>
            <DialogDescription className="text-sm font-bold text-[#666]">
              {pendingFile?.name} · {pendingFile ? formatFileSize(pendingFile.size) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-black text-sm">分类 (카테고리)</Label>
              <Select
                value={pendingCategory}
                onValueChange={(v) => setPendingCategory(v as Category)}
              >
                <SelectTrigger className="border-2 border-[#1E1E1E] rounded-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1E1E1E] rounded-none">
                  {(Object.entries(CATEGORY_LABELS) as [Category, typeof CATEGORY_LABELS[Category]][]).map(([key, cat]) => (
                    <SelectItem key={key} value={key} className="font-bold">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-sm">备注说明（可选）</Label>
              <Textarea
                value={pendingDescription}
                onChange={e => setPendingDescription(e.target.value)}
                placeholder="添加关于这个文件的说明..."
                className="border-2 border-[#1E1E1E] rounded-none font-medium resize-none"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setUploadDialogOpen(false); setPendingFile(null); }}
              className="border-2 border-[#1E1E1E] rounded-none font-black"
            >
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button
              onClick={handleUploadConfirm}
              disabled={uploadMutation.isPending}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white border-2 border-[#1E1E1E] rounded-none font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> 上传中...</>
              ) : (
                <><Upload className="w-4 h-4 mr-1" /> 确认上传</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogId !== null} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent className="border-4 border-[#1E1E1E] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription className="font-bold text-[#555]">
              删除后无法恢复，确认要删除这个文件吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogId(null)}
              className="border-2 border-[#1E1E1E] rounded-none font-black"
            >
              取消
            </Button>
            <Button
              onClick={() => deleteDialogId !== null && deleteMutation.mutate({ id: deleteDialogId })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white border-2 border-[#1E1E1E] rounded-none font-black"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> 删除中...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-1" /> 确认删除</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

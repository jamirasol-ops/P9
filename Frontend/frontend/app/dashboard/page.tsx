"use client";


import { clearTokens, getUserId } from "@/lib/auth";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LogOut, Pencil, Plus, RefreshCw, Trash2, X, } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface Typex {
  type_id: number;
  type_code: string;
  type_name: string;
  created_at?: string;
  updated_at?: string;
}


export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });


  // Data states
  const [typex, setTypex] = useState<Typex[]>([]);
  const [selectedTypex, setSelectedTypex] = useState<Typex | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // Form states (shared for Create and Update)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [typexCode, setTypexCode] = useState("");
  const [typexName, setTypexName] = useState("");


  // READ (All Typexs)
  const fetchTypex = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<Typex[]>(CONFIG.ENDPOINTS.TYPEX, {
        method: "GET",
        requiresAuth: true,
      });
      setTypex(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch typexs.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (!isChecking) {
      fetchTypex();
    }
  }, [isChecking, fetchTypex]);


  // READ (Single Typex)
  const handleViewTypex = async (typexId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Typex>(
        `${CONFIG.ENDPOINTS.TYPEX}/${typexId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );
      setSelectedTypex(data);
    } catch (err: any) {
      setError(err.message || "Failed to load typex details.")
    }
  };


  // Open Form for CREATE
  const openCreateForm = () => {
    setEditingId(null);
    setTypexCode("");
    setTypexName("");
    setSelectedTypex(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };


  // Open Form for UPDATE
  const openEditForm = (typex: Typex) => {
    setEditingId(typex.type_id);
    setTypexCode(typex.type_code);
    setTypexName (typex.type_name);
    setSelectedTypex(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };


  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTypexCode("");
    setTypexName("");
  };


  // CREATE & UPDATE Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");


    const userId = getUserId();
    if (!userId) {
      setError("Unable to determine user ID from token. Please log in again.");
      setSubmitting(false);
      return;
    }


    try {
      if (editingId != null) {
        // UPDATE (PUT /typexs/:id)
        await apiClient(`${CONFIG.ENDPOINTS.TYPEX}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            type_code: typexCode,
            type_name: typexName,
            type_id: userId,
          }),
        });
        setSuccess(`Typex #${editingId} updated successfully.`);
        } else {
          // CREATE (POST /typexs)
          await apiClient(CONFIG.ENDPOINTS.TYPEX, {
            method: "POST",
            requiresAuth: true,
            body: JSON. stringify({
              type_code: typexCode,
              type_name: typexName,
              type_id: userId,
          }),
        });
        setSuccess("New type created successfully.");
      }


      closeForm();
      await fetchTypex();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };


  // DELETE (DELETE /typexs/:id)
  const handleDelete = async (typexId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Type #${typexId}?`
    );
    if (!confirmed) return;


    setError("");
    setSuccess("");
    try {
      await apiClient(`${CONFIG.ENDPOINTS.TYPEX}/${typexId}`, {
        method: "DELETE",
        requiresAuth: true,
      });


      if (selectedTypex?.type_id == typexId) {
        setSelectedTypex(null);
      }
      setSuccess(`Type #${typexId} deleted successfully.`);
      await fetchTypex();
    } catch (err: any) {
      setError(err.message || "Failed to delete type.");
    }
  };


  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };


  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session ... </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen p-6 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage organization types
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>


        {/* Status Notification */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-900">
            {success}
          </div>
        )}


        {/* CREATE / UPDATE Form Card */}
        {isFormOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>
                  {editingId != null
                  ? `Update Type #${editingId}`
                  : "Create New Type"}
                </CardTitle>
                <CardDescription>
                  {editingId != null
                  ? "Modify the Type code and name below."
                  : "Fill in the details to add a new type."}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type_code">Type Code</Label>
                    <Input
                      id="type_code"
                      placeholder="e.g. Pres"
                      value={typexCode}
                      onChange={(e) => setTypexCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type_name">Type Name</Label>
                    <Input
                      id="type_name"
                      placeholder="e.g. President"
                      value={typexName}
                      onChange={(e) => setTypexName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "Saving..."
                      : editingId != null
                      ? "Save Changes"
                      : "Create Type"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}


        {/* READ Single Item Details Card */}
        {selectedTypex && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  Type Details (#{selectedTypex.type_id})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET /typex/
                  {selectedTypex.type_id}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTypex(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Type ID</span>
                <span className="font-medium">
                  {selectedTypex.type_id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Code</span>
                <span className="font-medium">
                  {selectedTypex.type_code}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Name</span>
                <span className="font-medium">
                  {selectedTypex.type_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {selectedTypex.created_at
                    ? new Date(selectedTypex.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Typexs Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Typexs</CardTitle>
              <CardDescription>
                A list of all typexs stored in the backend.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchTypex}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Typex
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">ID</TableHead>
                    <TableHead>Type Code</TableHead>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No typexs found. Click &quot;Create Typex&quot; to
                        add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    typex.map((pos) => (
                      <TableRow key={pos.type_id}>
                        <TableCell className="font-medium">
                          {pos.type_id}
                        </TableCell>
                        <TableCell>{pos.type_code}</TableCell>
                        <TableCell>{pos.type_name}</TableCell>
                        <TableCell>
                          {pos.created_at
                            ? new Date(pos.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewTypex(pos.type_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(pos)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(pos.type_id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
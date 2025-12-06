"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Trash2, RefreshCw, CheckCircle2, XCircle, TestTube2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SyncMethod {
    id?: string;
    name: string;
    endpointUrl: string;
    description: string;
    httpMethod: string;
    requestSchema: Record<string, unknown>;
    responseSchema: Record<string, unknown>;
    headers: Record<string, string>;
    syncInterval: string;
    connectionStatus: string;
    lastTestedAt?: Date;
    isActive: boolean;
    lastSyncedAt?: Date;
}

interface DataSyncConfig {
    id?: string;
    syncId: string;
    appName: string;
    description: string;
    isActive: boolean;
    syncMethods: SyncMethod[];
}

const defaultMethods: SyncMethod[] = [
    {
        name: "Sync Contacts",
        endpointUrl: "",
        description: "Synchronize contacts from video conference platform",
        httpMethod: "POST",
        requestSchema: { page: 1, limit: 100 },
        responseSchema: { success: true, data: [], total: 0 },
        headers: { "Content-Type": "application/json" },
        syncInterval: "30min",
        connectionStatus: "untested",
        isActive: false,
    },
    {
        name: "Sync Companies",
        endpointUrl: "",
        description: "Synchronize companies/organizations from video conference platform",
        httpMethod: "POST",
        requestSchema: { page: 1, limit: 100 },
        responseSchema: { success: true, data: [], total: 0 },
        headers: { "Content-Type": "application/json" },
        syncInterval: "30min",
        connectionStatus: "untested",
        isActive: false,
    },
    {
        name: "Sync Users",
        endpointUrl: "",
        description: "Synchronize users from video conference platform",
        httpMethod: "POST",
        requestSchema: { page: 1, limit: 100 },
        responseSchema: { success: true, data: [], total: 0 },
        headers: { "Content-Type": "application/json" },
        syncInterval: "30min",
        connectionStatus: "untested",
        isActive: false,
    },
    {
        name: "Sync Recordings",
        endpointUrl: "",
        description: "Synchronize meeting recordings from video conference platform",
        httpMethod: "POST",
        requestSchema: { from: "2024-01-01", to: "2024-12-31", page: 1, limit: 100 },
        responseSchema: { success: true, data: [], total: 0 },
        headers: { "Content-Type": "application/json" },
        syncInterval: "30min",
        connectionStatus: "untested",
        isActive: false,
    },
    {
        name: "Sync Transcripts",
        endpointUrl: "",
        description: "Synchronize meeting transcripts from video conference platform",
        httpMethod: "POST",
        requestSchema: { from: "2024-01-01", to: "2024-12-31", page: 1, limit: 100 },
        responseSchema: { success: true, data: [], total: 0 },
        headers: { "Content-Type": "application/json" },
        syncInterval: "30min",
        connectionStatus: "untested",
        isActive: false,
    },
];

export default function VideoConferencePage() {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<DataSyncConfig>({
        syncId: "",
        appName: "",
        description: "",
        isActive: true,
        syncMethods: defaultMethods,
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/data-sync/video-conference");
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setConfig(data);
                }
            }
        } catch (error) {
            console.error("Failed to load config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/data-sync/video-conference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                toast.success("Video conference sync configuration saved successfully");
                await loadConfig();
            } else {
                throw new Error("Failed to save configuration");
            }
        } catch (error) {
            toast.error("Failed to save configuration");
        } finally {
            setLoading(false);
        }
    };

    const updateMethod = (index: number, field: keyof SyncMethod, value: unknown) => {
        const updatedMethods = [...config.syncMethods];
        updatedMethods[index] = { ...updatedMethods[index], [field]: value };
        setConfig({ ...config, syncMethods: updatedMethods });
    };

    const updateMethodJson = (index: number, field: "requestSchema" | "responseSchema" | "headers", value: string) => {
        try {
            const parsed = JSON.parse(value);
            updateMethod(index, field, parsed);
        } catch (error) {
            // Invalid JSON, don't update
            console.error("Invalid JSON:", error);
        }
    };

    const testConnection = async (index: number) => {
        const method = config.syncMethods[index];

        if (!method.endpointUrl) {
            toast.error("Please enter an endpoint URL first");
            return;
        }

        try {
            setLoading(true);
            toast.info("Testing connection...");

            const response = await fetch(method.endpointUrl, {
                method: method.httpMethod,
                headers: method.headers,
                body: method.httpMethod !== "GET" ? JSON.stringify(method.requestSchema) : undefined,
            });

            if (response.ok) {
                updateMethod(index, "connectionStatus", "success");
                updateMethod(index, "lastTestedAt", new Date());
                updateMethod(index, "isActive", true);
                toast.success("Connection successful! Method activated.");
            } else {
                updateMethod(index, "connectionStatus", "failed");
                updateMethod(index, "lastTestedAt", new Date());
                updateMethod(index, "isActive", false);
                toast.error(`Connection failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            updateMethod(index, "connectionStatus", "failed");
            updateMethod(index, "lastTestedAt", new Date());
            updateMethod(index, "isActive", false);
            toast.error(`Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Video Conference Sync</h1>
                    <p className="text-muted-foreground mt-2">
                        Configure synchronization endpoints for video conference data
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                        Configure the basic settings for your video conference integration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="syncId">Sync ID</Label>
                            <Input
                                id="syncId"
                                placeholder="e.g., zoom-sync-001"
                                value={config.syncId}
                                onChange={(e) => setConfig({ ...config, syncId: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appName">App Name</Label>
                            <Input
                                id="appName"
                                placeholder="e.g., Zoom, Microsoft Teams, Google Meet"
                                value={config.appName}
                                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe this sync configuration..."
                            value={config.description}
                            onChange={(e) => setConfig({ ...config, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={config.isActive}
                            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                            Active
                        </Label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sync Methods</CardTitle>
                    <CardDescription>
                        Configure endpoints for each sync method
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="0" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            {config.syncMethods.map((method, index) => (
                                <TabsTrigger key={index} value={index.toString()}>
                                    {method.name.replace("Sync ", "")}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {config.syncMethods.map((method, index) => (
                            <TabsContent key={index} value={index.toString()} className="space-y-4 mt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">{method.name}</h3>
                                        {method.connectionStatus === "success" ? (
                                            <Badge variant="default" className="bg-green-500">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Connected
                                            </Badge>
                                        ) : method.connectionStatus === "failed" ? (
                                            <Badge variant="destructive">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Failed
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Untested
                                            </Badge>
                                        )}
                                    </div>
                                    {method.lastTestedAt && (
                                        <p className="text-sm text-muted-foreground">
                                            Last tested: {new Date(method.lastTestedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`endpoint-${index}`}>Endpoint URL</Label>
                                        <Input
                                            id={`endpoint-${index}`}
                                            placeholder="https://api.example.com/sync/contacts"
                                            value={method.endpointUrl}
                                            onChange={(e) => updateMethod(index, "endpointUrl", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`description-${index}`}>Description</Label>
                                        <Textarea
                                            id={`description-${index}`}
                                            value={method.description}
                                            onChange={(e) => updateMethod(index, "description", e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`method-${index}`}>HTTP Method</Label>
                                            <select
                                                id={`method-${index}`}
                                                value={method.httpMethod}
                                                onChange={(e) => updateMethod(index, "httpMethod", e.target.value)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="DELETE">DELETE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`interval-${index}`}>Sync Interval</Label>
                                            <select
                                                id={`interval-${index}`}
                                                value={method.syncInterval}
                                                onChange={(e) => updateMethod(index, "syncInterval", e.target.value)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="5min">Every 5 minutes</option>
                                                <option value="10min">Every 10 minutes</option>
                                                <option value="30min">Every 30 minutes</option>
                                                <option value="2h">Every 2 hours</option>
                                                <option value="6h">Every 6 hours</option>
                                                <option value="12h">Every 12 hours</option>
                                                <option value="24h">Every 24 hours</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => testConnection(index)}
                                                disabled={loading || !method.endpointUrl}
                                                className="w-full"
                                            >
                                                <TestTube2 className="h-4 w-4 mr-2" />
                                                Test Connection
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`headers-${index}`}>Headers (JSON)</Label>
                                        <Textarea
                                            id={`headers-${index}`}
                                            value={JSON.stringify(method.headers, null, 2)}
                                            onChange={(e) => updateMethodJson(index, "headers", e.target.value)}
                                            rows={3}
                                            className="font-mono text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`request-${index}`}>Request Schema (JSON)</Label>
                                        <Textarea
                                            id={`request-${index}`}
                                            value={JSON.stringify(method.requestSchema, null, 2)}
                                            onChange={(e) => updateMethodJson(index, "requestSchema", e.target.value)}
                                            rows={5}
                                            className="font-mono text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`response-${index}`}>Response Schema (JSON)</Label>
                                        <Textarea
                                            id={`response-${index}`}
                                            value={JSON.stringify(method.responseSchema, null, 2)}
                                            onChange={(e) => updateMethodJson(index, "responseSchema", e.target.value)}
                                            rows={5}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { Building2 } from "lucide-react";

interface Client {
  id: number;
  client_name: string;
  email: string;
}

interface Props {
  baseUrl: string;
  token: string;
  value?: number; // selected client ID
  onChange: (clientId: number | null, client?: Client | null) => void;
}

export default function ClientSelect({ baseUrl, token, value, onChange }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(`${baseUrl}/clients/get-all/${token}`);
        setClients(res.data || []);
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [baseUrl, token]);

  useEffect(() => {
    if (value && clients.length > 0) {
      const found = clients.find((c) => c.id === value) || null;
      setSelectedClient(found);
    }
  }, [value, clients]);

  const options = clients.map((client) => ({
    value: client.id,
    label: (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        <div>
          <div className="font-medium">{client.client_name}</div>
          <div className="text-xs text-muted-foreground">{client.email}</div>
        </div>
      </div>
    ),
    raw: client,
  }));

  return (
    <div className="w-full">
      <Select
        isLoading={loading}
        className="react-select-container w-full"
        classNamePrefix="react-select"
        placeholder="Search and select client..."
        value={
          selectedClient
            ? {
                value: selectedClient.id,
                label: (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{selectedClient.client_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedClient.email}
                      </div>
                    </div>
                  </div>
                ),
              }
            : null
        }
        onChange={(selectedOption: any) => {
          if (selectedOption) {
            const client = clients.find((c) => c.id === selectedOption.value) || null;
            setSelectedClient(client);
            onChange(selectedOption.value, client);
          } else {
            setSelectedClient(null);
            onChange(null, null);
          }
        }}
        options={options}
      />
    </div>
  );
}

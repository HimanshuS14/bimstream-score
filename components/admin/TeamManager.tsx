"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash2, ShieldCheck, Eye } from "lucide-react";
import { inviteAdmin, removeAdmin, updateAdminRole } from "@/lib/actions/adminTeam";
import type { AdminProfile, AdminRole } from "@/lib/types";

function RoleBadge({ role }: { role: AdminRole }) {
  if (role === "admin") {
    return (
      <span className="badge badge-primary">
        <ShieldCheck size={12} /> Admin
      </span>
    );
  }
  return (
    <span className="badge badge-neutral">
      <Eye size={12} /> Reviewer
    </span>
  );
}

export default function TeamManager({
  members,
  currentUserId,
}: {
  members: AdminProfile[];
  currentUserId: string;
}) {
  const [list, setList] = useState(members);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("reviewer");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await inviteAdmin(name, email, role);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(`Invite sent to ${email}. They'll receive an email to set their password.`);
      setName("");
      setEmail("");
      setRole("reviewer");
      // Optimistically add a placeholder row; the real row (with its Supabase
      // user id) will show correctly on next page load / refresh.
      setList((prev) => [
        ...prev,
        {
          id: `pending-${prev.length}`,
          name,
          email,
          role,
          created_at: new Date().toISOString(),
        },
      ]);
    });
  }

  function handleRemove(id: string) {
    if (!confirm("Remove this person's access? They will no longer be able to sign in.")) return;
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await removeAdmin(id);
      setBusyId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setList((prev) => prev.filter((m) => m.id !== id));
    });
  }

  function handleRoleChange(id: string, newRole: AdminRole) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await updateAdminRole(id, newRole);
      setBusyId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setList((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInvite} className="surface-card p-5">
        <h2 className="font-semibold mb-4 text-[var(--md-on-surface)] flex items-center gap-2">
          <UserPlus size={18} /> Add a team member
        </h2>
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <label className="text-sm">
            <span className="block mb-1 text-[var(--md-on-surface-variant)]">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Jane Doe"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-[var(--md-on-surface-variant)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="jane@bimstream.com"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-[var(--md-on-surface-variant)]">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="input"
            >
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? "Sending…" : "Send invite"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2 mt-3">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm text-[var(--md-on-success-container)] bg-[var(--md-success-container)] rounded-[var(--radius-sm)] px-3 py-2 mt-3">
            {notice}
          </p>
        )}
      </form>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-outline-variant)]">
            {list.map((m) => {
              const isSelf = m.id === currentUserId;
              const isBusy = busyId === m.id;
              return (
                <tr key={m.id} className="hover:bg-[var(--md-surface-variant)] transition">
                  <td className="px-4 py-3 text-[var(--md-on-surface)] font-medium">
                    {m.name}
                    {isSelf && (
                      <span className="text-[var(--md-on-surface-variant)] font-normal"> (you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--md-on-surface-variant)]">{m.email}</td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <RoleBadge role={m.role} />
                    ) : (
                      <select
                        value={m.role}
                        disabled={isBusy}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as AdminRole)}
                        className="input !py-1 !px-2 text-sm"
                      >
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRemove(m.id)}
                        className="btn btn-danger !px-3 !py-1.5 text-xs"
                      >
                        <Trash2 size={13} /> {isBusy ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--md-on-surface-muted)]">
                  No team members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

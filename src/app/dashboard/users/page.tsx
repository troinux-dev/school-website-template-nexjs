import { asc } from "drizzle-orm";
import { Send, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { PageTitle, Panel, StatusPill } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { changeRole, inviteUser, removeUser } from "../_actions/users";

export default async function UsersDashboard() {
  const me = await requireAdmin();
  const users = await db.select().from(schema.users).orderBy(asc(schema.users.email));
  return (
    <>
      <PageTitle title="Users & roles" intro="Everyone signs in with their Microsoft school account and confirms with the Authenticator app." />
      <div className="space-y-6">
        <Panel title="What each role can do" id="roles">
          <dl className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-primary-soft p-4">
              <dt className="font-semibold">Admin</dt>
              <dd className="mt-1 text-slate-700">Everything: website pages, news & blog, gallery, calendar, admissions settings and users.</dd>
            </div>
            <div className="rounded-xl bg-slate-100 p-4">
              <dt className="font-semibold">Staff (advisor group)</dt>
              <dd className="mt-1 text-slate-700">Upload photos, add calendar events, see enquiries and switch admissions on or off.</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Invite someone" id="invite">
          <form action={inviteUser} className="grid gap-4 md:grid-cols-[1fr_1fr_12rem_auto] md:items-end">
            <Field label="School email" htmlFor="email" required>
              <Input id="email" name="email" type="email" autoCapitalize="none" autoCorrect="off" required />
            </Field>
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" autoComplete="off" />
            </Field>
            <Field label="Role" htmlFor="role" required>
              <Select id="role" name="role" defaultValue="staff">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Button type="submit"><Send aria-hidden /> Send invite</Button>
          </form>
        </Panel>

        <Panel title={`People with access (${users.length})`} id="people">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left">
              <thead className="border-b border-slate-200 text-sm text-slate-600">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Email</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Role</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                  <th scope="col" className="py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-4 font-semibold">{u.name ?? "—"}{u.id === me.id && <span className="font-normal text-slate-600"> (you)</span>}</td>
                    <td className="break-all py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">
                      <form action={changeRole} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <label htmlFor={`role-${u.id}`} className="sr-only">Role for {u.email}</label>
                        <Select id={`role-${u.id}`} name="role" defaultValue={u.role} className="w-32">
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </Select>
                        <Button type="submit" variant="ghost" size="sm">Save <span className="sr-only">role for {u.email}</span></Button>
                      </form>
                    </td>
                    <td className="py-2 pr-4">{u.status === "active" ? <StatusPill tone="green">Active</StatusPill> : <StatusPill tone="amber">Invite sent</StatusPill>}</td>
                    <td className="py-2">
                      {u.id !== me.id && (
                        <form action={removeUser} className="flex justify-end">
                          <input type="hidden" name="id" value={u.id} />
                          <Button type="submit" variant="dangerGhost" size="sm"><Trash2 aria-hidden /> Remove <span className="sr-only">{u.email}</span></Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

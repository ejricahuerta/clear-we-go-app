import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clear We Go</h1>
        <p className="text-muted-foreground mt-1">Admin</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Track outreach and convert leads to clients</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/contacts">
              <Button variant="outline" className="w-full">Open contacts</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Client profiles and timelines</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/clients">
              <Button variant="outline" className="w-full">Open clients</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Jobs, stages, and key/access</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/projects">
              <Button variant="outline" className="w-full">Open projects</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Team invites and settings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/team">
            <Button variant="secondary">Team</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

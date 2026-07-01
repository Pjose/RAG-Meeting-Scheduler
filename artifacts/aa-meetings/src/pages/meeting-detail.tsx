import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, Globe, Clock, BookOpen, Users, Info, Phone, Mail, ChevronRight } from "lucide-react";
import { useGetMeeting, getGetMeetingQueryKey } from "@workspace/api-client-react";
import { formatTime } from "@/lib/constants";
import { PublicLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, canManage } from "@/lib/auth";

function ContactMask({ person, showContact }: { person: any; showContact: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border" data-testid={`contact-card-${person.id}`}>
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
        {person.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground">{person.name}</p>
        <p className="text-xs text-muted-foreground">{person.assignedRole || person.role}</p>
        {showContact && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                data-testid={`contact-phone-${person.id}`}
              >
                <Phone size={11} />
                Call
              </a>
            )}
            {person.email && (
              <a
                href={`mailto:${person.email}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                data-testid={`contact-email-${person.id}`}
              >
                <Mail size={11} />
                Email
              </a>
            )}
            {!person.phone && !person.email && (
              <span className="text-xs text-muted-foreground italic">Contact info not listed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeetingDetail() {
  const [match, params] = useRoute("/meetings/:id");
  const id = match ? parseInt(params.id, 10) : 0;
  const { data: auth } = useAuth();
  const showContact = canManage(auth?.role);

  const { data: meeting, isLoading } = useGetMeeting(id, {
    query: { enabled: !!id, queryKey: getGetMeetingQueryKey(id) },
  });

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="back-link">
          <ArrowLeft size={15} />
          Back to schedule
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : !meeting ? (
          <div className="text-center py-16">
            <p className="text-foreground font-medium">Meeting not found</p>
            <Link href="/" className="text-sm text-primary mt-2 inline-block hover:underline">Back to schedule</Link>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3 flex-wrap">
                <Badge variant="outline" className="text-xs">{meeting.type}</Badge>
                <Badge variant="outline" className="text-xs">{meeting.interaction}</Badge>
                {meeting.language !== "English" && (
                  <Badge variant="outline" className="text-xs">{meeting.language}</Badge>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-1">{meeting.name}</h1>
              <p className="text-muted-foreground text-sm">{meeting.day}s &bull; {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}</p>
            </div>

            {/* Details card */}
            <div className="bg-card border border-card-border rounded-xl p-5 mb-5 space-y-4" data-testid="meeting-details-card">
              <DetailRow icon={<Clock size={15} />} label="Time">
                {meeting.day}, {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
              </DetailRow>
              {meeting.location && (
                <DetailRow icon={<MapPin size={15} />} label="Location">
                  {meeting.location}
                </DetailRow>
              )}
              {meeting.link && (
                <DetailRow icon={<Globe size={15} />} label="Online Link">
                  <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all" data-testid="meeting-link">
                    {meeting.link}
                  </a>
                </DetailRow>
              )}
              <DetailRow icon={<Users size={15} />} label="Format">
                {meeting.format}
              </DetailRow>
              {meeting.literature && (
                <DetailRow icon={<BookOpen size={15} />} label="Literature">
                  {meeting.literature}
                </DetailRow>
              )}
              {meeting.notes && (
                <DetailRow icon={<Info size={15} />} label="Notes">
                  <span className="text-muted-foreground">{meeting.notes}</span>
                </DetailRow>
              )}
            </div>

            {/* Contacts */}
            {meeting.people && meeting.people.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm text-foreground mb-3">Contacts &amp; Chairpersons</h2>
                <div className="space-y-2">
                  {meeting.people.map((person: any) => (
                    <ContactMask key={person.id} person={person} showContact={showContact} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs text-muted-foreground block mb-0.5">{label}</span>
        <span className="text-sm text-foreground">{children}</span>
      </div>
    </div>
  );
}

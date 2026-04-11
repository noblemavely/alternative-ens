import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, CheckCircle, Clock } from "lucide-react";

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: "expert_created" | "added_to_project" | "status_changed";
  title: string;
  description: string;
  projectId?: number;
  projectName?: string;
  toStatus?: string;
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
  projectName?: string;
  isLoading?: boolean;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "interested":
      return "bg-blue-100 text-blue-800";
    case "contacted":
      return "bg-yellow-100 text-yellow-800";
    case "engaged":
      return "bg-green-100 text-green-800";
    case "qualified":
      return "bg-purple-100 text-purple-800";
    case "proposal_sent":
      return "bg-indigo-100 text-indigo-800";
    case "negotiation":
      return "bg-orange-100 text-orange-800";
    case "verbal_agreement":
      return "bg-teal-100 text-teal-800";
    case "closed_won":
      return "bg-emerald-100 text-emerald-800";
    case "closed_lost":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case "expert_created":
      return <Users className="w-5 h-5 text-blue-600" />;
    case "added_to_project":
      return <Briefcase className="w-5 h-5 text-green-600" />;
    case "status_changed":
      return <CheckCircle className="w-5 h-5 text-purple-600" />;
    default:
      return <Clock className="w-5 h-5 text-gray-600" />;
  }
};

export default function ActivityTimeline({
  events,
  projectName,
  isLoading,
}: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
          <CardDescription>
            {projectName ? `Activity for ${projectName}` : "Expert activity history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading activity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
          <CardDescription>
            {projectName ? `Activity for ${projectName}` : "Expert activity history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
        <CardDescription>
          {projectName ? `Activity for ${projectName}` : "Expert activity history"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline line and icon */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-300">
                  {getEventIcon(event.type)}
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 h-12 bg-slate-200 mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {new Date(event.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Status badge if applicable */}
                {event.toStatus && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-600">Status:</span>
                    <Badge className={getStatusColor(event.toStatus)}>
                      {event.toStatus
                        .replace(/_/g, " ")
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </Badge>
                  </div>
                )}

                {/* Project name if applicable */}
                {event.projectName && !projectName && (
                  <div className="mt-2 text-xs text-slate-600">
                    Project: <span className="font-medium">{event.projectName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

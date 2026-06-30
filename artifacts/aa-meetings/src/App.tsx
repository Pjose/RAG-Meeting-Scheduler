import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Schedule from "@/pages/schedule";
import HiSchedule from "@/pages/hi-schedule";
import MeetingDetail from "@/pages/meeting-detail";
import HiMeetingDetail from "@/pages/hi-meeting-detail";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminMeetings from "@/pages/admin/meetings";
import AdminMeetingEdit from "@/pages/admin/meeting-edit";
import AdminHiMeetings from "@/pages/admin/hi-meetings";
import AdminHiMeetingEdit from "@/pages/admin/hi-meeting-edit";
import AdminPeople from "@/pages/admin/people";
import AdminPersonEdit from "@/pages/admin/person-edit";
import PrintSchedule from "@/pages/admin/print-schedule";
import PrintContacts from "@/pages/admin/print-contacts";
import PrintHiSchedule from "@/pages/admin/print-hi-schedule";
import AdminLogin from "@/pages/admin/login";
import AdminTrustedServants from "@/pages/admin/trusted-servants";
import AdminTrustedServantEdit from "@/pages/admin/trusted-servant-edit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Schedule} />
      <Route path="/hi" component={HiSchedule} />
      <Route path="/hi/:id" component={HiMeetingDetail} />
      <Route path="/meetings/:id" component={MeetingDetail} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/meetings" component={AdminMeetings} />
      <Route path="/admin/meetings/new" component={AdminMeetingEdit} />
      <Route path="/admin/meetings/:id" component={AdminMeetingEdit} />
      <Route path="/admin/hi-meetings" component={AdminHiMeetings} />
      <Route path="/admin/hi-meetings/new" component={AdminHiMeetingEdit} />
      <Route path="/admin/hi-meetings/:id" component={AdminHiMeetingEdit} />
      <Route path="/admin/people" component={AdminPeople} />
      <Route path="/admin/people/new" component={AdminPersonEdit} />
      <Route path="/admin/people/:id" component={AdminPersonEdit} />
      <Route path="/admin/trusted-servants" component={AdminTrustedServants} />
      <Route path="/admin/trusted-servants/new" component={AdminTrustedServantEdit} />
      <Route path="/admin/trusted-servants/:id" component={AdminTrustedServantEdit} />
      <Route path="/admin/print/schedule" component={PrintSchedule} />
      <Route path="/admin/print/contacts" component={PrintContacts} />
      <Route path="/admin/print/hi-schedule" component={PrintHiSchedule} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

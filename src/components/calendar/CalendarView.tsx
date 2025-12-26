import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, EventContentArg } from '@fullcalendar/core';
import { formatDuration } from '@/utils/dateHelpers';
import './calendar.css';

interface CalendarViewProps {
  events: any[];
  onEventClick?: (info: EventClickArg) => void;
  onDateSelect?: (info: DateSelectArg) => void;
  onEventDrop?: (info: EventDropArg) => void;
  view?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
}

export interface CalendarViewRef {
  changeView: (view: string) => void;
  today: () => void;
  next: () => void;
  prev: () => void;
}

export const CalendarView = forwardRef<CalendarViewRef, CalendarViewProps>(
  ({ events, onEventClick, onDateSelect, onEventDrop, view = 'dayGridMonth' }, ref) => {
    const calendarRef = useRef<FullCalendar>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      changeView: (newView: string) => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.changeView(newView);
        }
      },
      today: () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.today();
        }
      },
      next: () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.next();
        }
      },
      prev: () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.prev();
        }
      },
    }));

    // Custom event content with tooltip
    const renderEventContent = (eventInfo: EventContentArg) => {
      const { extendedProps } = eventInfo.event;
      const studentName = extendedProps.studentName || extendedProps.contactName || 'Unknown';
      const categoryName = extendedProps.categoryName || 'Other';
      const duration = formatDuration(extendedProps.durationMinutes || 0);
      
      // Build tooltip text
      let tooltipText = `${studentName}\n${categoryName}\n${duration}`;
      
      // Add regarding student info for contact interactions
      if (extendedProps.contactName && extendedProps.regardingStudentName) {
        tooltipText = `${extendedProps.contactName} (re: ${extendedProps.regardingStudentName})\n${categoryName}\n${duration}`;
      }
      
      // Add notes if available
      if (extendedProps.notes) {
        tooltipText += `\n${extendedProps.notes}`;
      }
      
      // Simplified event display for mobile
      if (isMobile) {
        return (
          <div className="fc-event-main-frame">
            <div className="fc-event-time">{eventInfo.timeText}</div>
            <div className="fc-event-title-container">
              <div className="fc-event-title fc-sticky">
                {extendedProps.contactName && extendedProps.regardingStudentName 
                  ? `${extendedProps.contactName} (re: ${extendedProps.regardingStudentName})`
                  : studentName
                }
              </div>
            </div>
          </div>
        );
      }
      
      // Full event display for desktop with tooltip
      return (
        <div className="fc-event-main-frame" title={tooltipText}>
          <div className="fc-event-time">{eventInfo.timeText}</div>
          <div className="fc-event-title-container">
            <div className="fc-event-title fc-sticky">
              {eventInfo.event.title}
            </div>
          </div>
        </div>
      );
    };

    // Determine initial view based on screen size
    const initialView = isMobile ? 'timeGridDay' : view;
    
    // Disable drag-and-drop on mobile
    const isEditable = !isMobile;

    return (
      <div className="calendar-container bg-white rounded-lg shadow p-2 sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={
            isMobile
              ? {
                  left: 'prev,next',
                  center: 'title',
                  right: 'today',
                }
              : {
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }
          }
          events={events}
          editable={isEditable}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={isMobile ? 3 : true}
          weekends={true}
          eventClick={onEventClick}
          select={onDateSelect}
          eventDrop={isEditable ? onEventDrop : undefined}
          eventContent={renderEventContent}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          eventClassNames={isMobile ? 'fc-event-mobile' : ''}
        />
      </div>
    );
  }
);

CalendarView.displayName = 'CalendarView';

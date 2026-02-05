import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Notification, NotificationType, Priority } from '@/features/manual-booking/types';
import { Bell, Send } from 'lucide-react';

interface NotificationPanelProps {
  customerId: string;
  onSend: (notification: Omit<Notification, 'id' | 'sentAt' | 'status'>) => void;
}

export function NotificationPanel({ customerId, onSend }: NotificationPanelProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<NotificationType>('email');
  const [priority, setPriority] = useState<Priority>('medium');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    
    onSend({
      customerId,
      title,
      type,
      priority,
      message,
    });
    
    // Reset form
    setTitle('');
    setMessage('');
    setPriority('medium');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Send Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="notificationTitle">Title</Label>
            <Input
              id="notificationTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification Title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notificationType">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            rows={3}
          />
        </div>
        
        <Button onClick={handleSend} className="w-full" disabled={!title.trim() || !message.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </CardContent>
    </Card>
  );
}

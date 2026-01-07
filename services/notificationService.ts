
export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkPermission() {
    if (!("Notification" in window)) {
      console.warn("Questo browser non supporta le notifiche desktop");
      return;
    }
    this.permissionGranted = Notification.permission === "granted";
  }

  public async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.permissionGranted = permission === "granted";
    return this.permissionGranted;
  }

  public sendNotification(title: string, body: string, icon: string = '/favicon.ico') {
    if (!this.permissionGranted) {
      console.log("Notifica simulata (permessi negati):", title, body);
      return;
    }

    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
      });
    } catch (e) {
      console.error("Errore nell'invio della notifica:", e);
    }
  }

  public notifyMatchStarting(home: string, away: string, time: string) {
    this.sendNotification(
      "🏆 Match in Inizio!",
      `Il match ${home} vs ${away} inizierà alle ${time}. Preparati per la tua schedina!`
    );
  }

  public notifyBetSettled(status: 'Won' | 'Lost', winnings?: number) {
    const title = status === 'Won' ? "🎉 SCHEDINA VINTA!" : "❌ Esito Disponibile";
    const body = status === 'Won' 
      ? `Complimenti! Hai vinto €${winnings?.toFixed(2)}. Controlla la tua cronologia.` 
      : "Purtroppo la tua schedina non è andata come previsto. Ritenta oggi!";
    
    this.sendNotification(title, body);
  }
}

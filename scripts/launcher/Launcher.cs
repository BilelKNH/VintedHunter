using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;

// Double-click launcher for the Vinted Hunter stack: starts Docker Desktop if it isn't
// running, brings the docker-compose stack up, waits for the dashboard to answer, then
// opens it in the default browser. Deliberately a console app (not WinExe) so failures
// are visible instead of silently vanishing.
internal static class Launcher
{
    private const string DashboardUrl = "http://localhost:3000";
    private const string DockerDesktopExe = @"C:\Program Files\Docker\Docker\Docker Desktop.exe";

    private static int Main()
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Console.Title = "Vinted Hunter — Launcher";
        string projectRoot = FindProjectRoot();
        Console.WriteLine($"Projet : {projectRoot}");

        if (!IsDockerRunning())
        {
            Console.WriteLine("Docker Desktop n'est pas démarré, lancement en cours...");
            StartDockerDesktop();
            if (!WaitFor(IsDockerRunning, TimeSpan.FromMinutes(2), "Docker Desktop"))
            {
                return Fail("Docker Desktop n'a pas démarré à temps. Lance-le manuellement et réessaie.");
            }
        }
        Console.WriteLine("Docker est prêt.");

        Console.WriteLine("Démarrage des containers (docker compose up -d)...");
        int exitCode = RunDockerCompose(projectRoot);
        if (exitCode != 0)
        {
            return Fail($"docker compose up -d a échoué (code {exitCode}). Voir les logs ci-dessus.");
        }

        Console.WriteLine("Containers démarrés. Attente que le dashboard réponde...");
        if (!WaitFor(() => IsHttpUp(DashboardUrl), TimeSpan.FromMinutes(2), "dashboard"))
        {
            return Fail("Le dashboard ne répond pas encore. Vérifie l'état des containers avec 'docker ps'.");
        }

        Console.WriteLine("Ouverture du dashboard dans le navigateur...");
        Process.Start(new ProcessStartInfo(DashboardUrl) { UseShellExecute = true });

        Console.WriteLine();
        Console.WriteLine("C'est parti ! Les containers continuent de tourner même si tu fermes cette fenêtre.");
        Console.WriteLine("Appuie sur une touche pour fermer...");
        Console.ReadKey();
        return 0;
    }

    // Walks up from the exe's own folder to find the checkout root (identified by
    // docker-compose.yml) so the launcher still works if it's moved within the repo.
    private static string FindProjectRoot()
    {
        var dir = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "docker-compose.yml")))
        {
            dir = dir.Parent;
        }
        if (dir == null)
        {
            throw new InvalidOperationException("docker-compose.yml introuvable — l'exe doit rester dans le repo.");
        }
        return dir.FullName;
    }

    private static bool IsDockerRunning()
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo("docker", "info")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            });
            process!.WaitForExit();
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    private static void StartDockerDesktop()
    {
        Process.Start(new ProcessStartInfo(DockerDesktopExe) { UseShellExecute = true });
    }

    private static int RunDockerCompose(string projectRoot)
    {
        using var process = Process.Start(new ProcessStartInfo("docker", "compose up -d")
        {
            WorkingDirectory = projectRoot,
            UseShellExecute = false,
        });
        process!.WaitForExit();
        return process.ExitCode;
    }

    private static bool IsHttpUp(string url)
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            using var response = client.GetAsync(url).GetAwaiter().GetResult();
            return true; // any response (even a 3xx/4xx) means the server is up
        }
        catch
        {
            return false;
        }
    }

    private static bool WaitFor(Func<bool> condition, TimeSpan timeout, string label)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            if (condition())
            {
                return true;
            }
            Console.Write(".");
            Thread.Sleep(2000);
        }
        Console.WriteLine();
        return false;
    }

    private static int Fail(string message)
    {
        Console.WriteLine();
        Console.WriteLine($"Erreur : {message}");
        Console.WriteLine("Appuie sur une touche pour fermer...");
        Console.ReadKey();
        return 1;
    }
}

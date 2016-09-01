namespace BridgeConverter
{
    static class Program
    {
        static void Main(string[] args)
        {
            if (args.Length > 0)
            {
                var fileName = args[0];
                ConvertResults.ConvertToCSV(fileName);
            }
        }
    }
}
